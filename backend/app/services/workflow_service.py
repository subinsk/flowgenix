from sqlalchemy.orm import Session
from app.models.workflow import Workflow, WorkflowExecution
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, ValidationResult, WorkflowNodeBase, WorkflowEdgeBase
from app.services.ai_service import AIService
from app.services.search_service import SearchService
from app.services.document_service import DocumentService
from app.services.api_key_service import ApiKeyService
from typing import List, Optional, Dict, Any
import uuid
import asyncio
from datetime import datetime


# Helper to convert UUIDs to strings recursively
def convert_uuids(obj):
    if isinstance(obj, dict):
        return {k: convert_uuids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_uuids(i) for i in obj]
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    else:
        return obj


class WorkflowService:
    def __init__(self, db: Session = None):
        self.db = db
        self.ai_service = AIService()
        self.search_service = SearchService()
        self.document_service = DocumentService()
        if db:
            self.api_key_service = ApiKeyService(db)

    def create_workflow(self, user_id: str, workflow_data: WorkflowCreate) -> Workflow:
        """Create a new workflow"""
        db_workflow = Workflow(
            name=workflow_data.name,
            description=workflow_data.description,
            user_id=user_id,
            nodes=[node.dict() for node in workflow_data.nodes],
            edges=[edge.dict() for edge in workflow_data.edges]
        )
        self.db.add(db_workflow)
        self.db.commit()
        self.db.refresh(db_workflow)
        return db_workflow

    def get_workflow(self, workflow_id: str, user_id: str) -> Optional[Workflow]:
        """Get workflow by ID for specific user"""
        return self.db.query(Workflow).filter(
            Workflow.id == workflow_id,
            Workflow.user_id == user_id
        ).first()

    def get_user_workflows(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Workflow]:
        """Get all workflows for a user"""
        return self.db.query(Workflow).filter(
            Workflow.user_id == user_id
        ).offset(skip).limit(limit).all()

    def update_workflow(self, workflow_id: str, user_id: str, workflow_data: WorkflowUpdate) -> Optional[Workflow]:
        """Update workflow"""
        workflow = self.get_workflow(workflow_id, user_id)
        if not workflow:
            return None

        update_data = workflow_data.dict(exclude_unset=True)
        
        # Convert nodes and edges to dict format if provided
        if "nodes" in update_data and update_data["nodes"]:
            update_data["nodes"] = [node.dict() for node in update_data["nodes"]]
        if "edges" in update_data and update_data["edges"]:
            update_data["edges"] = [edge.dict() for edge in update_data["edges"]]

        for key, value in update_data.items():
            setattr(workflow, key, value)

        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def delete_workflow(self, workflow_id: str, user_id: str) -> bool:
        """Delete workflow"""
        workflow = self.get_workflow(workflow_id, user_id)
        if not workflow:
            return False

        self.db.delete(workflow)
        self.db.commit()
        return True

    def create_execution(self, workflow_id: str, user_id: str, query: str) -> WorkflowExecution:
        """Create a new workflow execution"""
        execution_id = str(uuid.uuid4())
        db_execution = WorkflowExecution(
            id=execution_id,
            workflow_id=workflow_id,
            user_id=user_id,
            input_query=query,
            status="running"
        )
        self.db.add(db_execution)
        self.db.commit()
        self.db.refresh(db_execution)
        return db_execution

    def update_execution_status(self, execution_id: str, status: str, result: dict = None, error: str = None) -> Optional[WorkflowExecution]:
        """Update execution status"""
        execution = self.db.query(WorkflowExecution).filter(WorkflowExecution.id == execution_id).first()
        if not execution:
            return None

        execution.status = status
        if result:
            execution.result = result
        if error:
            execution.error_message = error
        if status in ["completed", "failed"]:
            execution.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(execution)
        return execution

    def _has_path(self, source_id: str, target_id: str, edges: List[WorkflowEdgeBase]) -> bool:
        """Check if there's a path from source to target node through the edges"""
        if source_id == target_id:
            return True
        
        # Build adjacency list
        graph = {}
        for edge in edges:
            if edge.source not in graph:
                graph[edge.source] = []
            graph[edge.source].append(edge.target)
        
        # DFS to find path
        visited = set()
        
        def dfs(current_id: str) -> bool:
            if current_id == target_id:
                return True
            if current_id in visited:
                return False
            
            visited.add(current_id)
            
            for neighbor in graph.get(current_id, []):
                if dfs(neighbor):
                    return True
            
            return False
        
        return dfs(source_id)

    async def validate_workflow(self, nodes: List[WorkflowNodeBase], edges: List[WorkflowEdgeBase]) -> ValidationResult:
        """Validate workflow structure and configuration"""
        errors = []
        warnings = []
        
        # Check for required node types
        node_types = [node.type for node in nodes]
        
        if 'userQuery' not in node_types:
            errors.append('Workflow must contain a User Query component')
        
        if 'llmEngine' not in node_types:
            errors.append('Workflow must contain an LLM Engine component')
            
        if 'output' not in node_types:
            errors.append('Workflow must contain an Output component')
        
        # Check connections
        user_query_nodes = [n for n in nodes if n.type == 'userQuery']
        llm_engine_nodes = [n for n in nodes if n.type == 'llmEngine']
        output_nodes = [n for n in nodes if n.type == 'output']
        
        # Validate connections exist - check for connectivity paths, not just direct connections
        if user_query_nodes and llm_engine_nodes:
            # Check if there's a path from User Query to LLM Engine (direct or through other nodes)
            has_path = self._has_path(user_query_nodes[0].id, llm_engine_nodes[0].id, edges)
            if not has_path:
                errors.append('User Query must be connected to LLM Engine (directly or through other components)')
        
        if llm_engine_nodes and output_nodes:
            # Check if there's a path from LLM Engine to Output (direct or through other nodes)
            has_path = self._has_path(llm_engine_nodes[0].id, output_nodes[0].id, edges)
            if not has_path:
                errors.append('LLM Engine must be connected to Output (directly or through other components)')
        
        # Validate node configurations
        for node in nodes:
            if hasattr(node.data, 'configuration'):
                config = node.data.get('configuration', {})
                
                if node.type == 'llmEngine':
                    if not config.get('model'):
                        warnings.append(f'LLM Engine node "{node.id}" should specify a model')
                
                if node.type == 'knowledgeBase':
                    if not config.get('documents') and not config.get('vector_store'):
                        warnings.append(f'Knowledge Base node "{node.id}" should have documents or vector store configured')
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    async def build_execution_plan(self, nodes: List[WorkflowNodeBase], edges: List[WorkflowEdgeBase]) -> Dict[str, Any]:
        """Build execution plan from workflow nodes and edges"""
        # Create execution graph
        node_map = {node.id: node for node in nodes}
        execution_order = []
        
        # Find starting node (User Query)
        start_node = next((n for n in nodes if n.type == 'userQuery'), None)
        if not start_node:
            raise ValueError("No User Query node found")
        
        # Build execution order using topological sort
        visited = set()
        def visit(node_id: str):
            if node_id in visited:
                return
            visited.add(node_id)
            
            # Find outgoing edges
            outgoing = [e for e in edges if e.source == node_id]
            for edge in outgoing:
                visit(edge.target)
            
            execution_order.insert(0, node_id)
        
        visit(start_node.id)
        
        execution_plan = {
            "execution_order": execution_order,
            "nodes": {node.id: {
                "type": node.type,
                "configuration": node.data.get('configuration', {}),
                "position": node.position
            } for node in nodes},
            "edges": [{
                "source": edge.source,
                "target": edge.target,
                "sourceHandle": edge.sourceHandle,
                "targetHandle": edge.targetHandle
            } for edge in edges],
            "created_at": datetime.utcnow().isoformat()
        }
        
        return execution_plan

    async def execute_workflow(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], query: str, execution_id: str, user_id: str = None, workflow_id: str = None) -> Dict[str, Any]:
        """Execute workflow with given query"""
        context = {"query": query, "execution_id": execution_id}
        node_map = {node["id"]: node for node in nodes}
        start_node = next((n for n in nodes if n["type"] == "userQuery"), None)
        if not start_node:
            raise ValueError("No User Query node found")
        current_output = query

        # Get stored API keys for the user
        stored_api_keys = {}
        if user_id and self.api_key_service:
            try:
                # Get all stored API keys for the user
                for key_name in ["openai", "serpapi", "brave", "huggingface"]:
                    key_value = self.api_key_service.get_decrypted_api_key(user_id, key_name)
                    if key_value:
                        stored_api_keys[key_name] = key_value
            except Exception as e:
                print(f"Warning: Could not retrieve stored API keys: {e}")

        for node in nodes:
            node_type = node["type"]
            node_config = node.get("data", {})
            if node_type == "userQuery":
                context["user_query"] = query
                current_output = query
            elif node_type == "knowledgeBase":
                # For Knowledge Base nodes, search all documents for this workflow
                if workflow_id:
                    try:
                        # Search documents in ChromaDB for this workflow
                        collection = self.document_service._get_or_create_collection()
                        query_embedding = None
                        
                        # Try to get query embedding
                        try:
                            from app.services.ai_service import AIService
                            ai_service = AIService()
                            query_embedding = await ai_service.generate_embeddings(current_output)
                        except Exception as e:
                            print(f"Warning: Could not generate embeddings: {e}")
                        
                        if query_embedding:
                            # Search with embeddings
                            results = collection.query(
                                query_embeddings=[query_embedding],
                                n_results=5,
                                where={"workflow_id": workflow_id}
                            )
                            
                            if results and results['documents'] and results['documents'][0]:
                                relevant_content = "\n\n".join(results['documents'][0])
                                context["knowledge_context"] = results['documents'][0]
                                current_output = f"Query: {current_output}\n\nRelevant Information from Knowledge Base:\n{relevant_content}"
                        else:
                            # Fallback: get all documents for this workflow
                            try:
                                all_results = collection.get(
                                    where={"workflow_id": workflow_id}
                                )
                                if all_results and all_results['documents']:
                                    # Use first 3 documents as context
                                    relevant_content = "\n\n".join(all_results['documents'][:3])
                                    context["knowledge_context"] = all_results['documents'][:3]
                                    current_output = f"Query: {current_output}\n\nInformation from Knowledge Base:\n{relevant_content}"
                            except Exception as e:
                                print(f"Warning: Could not retrieve documents: {e}")
                    except Exception as e:
                        print(f"Warning: Knowledge Base search failed: {e}")
                        # Continue without knowledge base context
            elif node_type == "llmEngine":
                model = node_config.get("model", "gpt-3.5-turbo")
                system_prompt = node_config.get("systemPrompt", "You are a helpful assistant.")
                
                # Get API key - prefer node config, fallback to stored key
                llm_api_key = node_config.get("apiKey") or stored_api_keys.get("openai")
                
                # If web search is enabled, perform search first
                if node_config.get("webSearchEnabled", False):
                    search_provider = "serpapi"  # Default to serpapi for web search
                    search_api_key = node_config.get("serpApiKey") or stored_api_keys.get("serpapi")
                    
                    if search_api_key:
                        search_results = await self.search_service.search(
                            query=current_output,
                            provider=search_provider,
                            num_results=5,
                            api_key=search_api_key
                        )
                        
                        if search_results:
                            context["search_results"] = search_results
                            formatted_results = "\n".join([
                                f"Title: {result.get('title', '')}\nURL: {result.get('url', '')}\nSnippet: {result.get('snippet', '')}\n"
                                for result in search_results[:3]  # Limit to top 3 results
                            ])
                            system_prompt += f"\n\nCurrent web search results for the query:\n{formatted_results}"
                
                messages = [
                    {"role": "system", "content": system_prompt}
                ]
                if "knowledge_context" in context:
                    context_content = "\n".join([doc.get("content", "") for doc in context["knowledge_context"]])
                    messages.append({
                        "role": "system",
                        "content": f"Use the following context to answer the user's question:\n\n{context_content}"
                    })
                messages.append({"role": "user", "content": current_output})
                response = await self.ai_service.generate_response(
                    messages=messages,
                    model=model,
                    temperature=node_config.get("temperature", 0.7),
                    max_tokens=node_config.get("maxTokens", 1000),
                    api_key=llm_api_key
                )
                current_output = response["content"]
                context["llm_response"] = current_output
            elif node_type == "webSearch":
                provider = node_config.get("provider", "brave")
                # Get API key - prefer node config, fallback to stored key
                search_api_key = node_config.get("apiKey") or stored_api_keys.get(provider)
                search_results = await self.search_service.search(
                    query=current_output,
                    provider=provider,
                    num_results=node_config.get("numResults", 5),
                    api_key=search_api_key
                )
                context["search_results"] = search_results
                formatted_results = "\n".join([
                    f"Title: {result.get('title', '')}\nURL: {result.get('url', '')}\nSnippet: {result.get('snippet', '')}\n"
                    for result in search_results
                ])
                current_output = f"Search Query: {current_output}\n\nSearch Results:\n{formatted_results}"
            elif node_type == "output":
                output_format = node_config.get("format", "text")
                context["final_output"] = current_output
        result = {
            "result": current_output,
            "execution_context": context,
            "status": "completed",
            "execution_id": execution_id,
            "completed_at": datetime.utcnow().isoformat()
        }
        return convert_uuids(result)
