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
                for key_name in ["openai", "serpapi", "brave", "huggingface", "gemini"]:
                    key_value = self.api_key_service.get_decrypted_api_key(user_id, key_name)
                    if key_value:
                        stored_api_keys[key_name] = key_value
            except Exception as e:
                print(f"Warning: Could not retrieve stored API keys: {e}")

        # Sort nodes to ensure proper execution order: userQuery -> knowledgeBase -> llmEngine -> output
        node_order = {"userQuery": 1, "knowledgeBase": 2, "webSearch": 3, "llmEngine": 4, "output": 5}
        sorted_nodes = sorted(nodes, key=lambda x: node_order.get(x["type"], 99))
        
        print(f"DEBUG: Original node order: {[n['type'] for n in nodes]}")
        print(f"DEBUG: Sorted node order: {[n['type'] for n in sorted_nodes]}")

        for node in sorted_nodes:
            node_type = node["type"]
            # Try to get config from data.config first, then fall back to data directly
            node_data = node.get("data", {})
            node_config = node_data.get("config", {})
            
            # If config is empty, use the data directly (for backward compatibility)
            if not node_config:
                node_config = node_data
                
            print(f"DEBUG: Processing node type={node_type}, config={node_config}")
            print(f"DEBUG: Full node data: {node.get('data', {})}")
            print(f"DEBUG: Node keys: {list(node.keys())}")
            if "data" in node:
                print(f"DEBUG: Data keys: {list(node['data'].keys())}")
            
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
                        
                        print(f"DEBUG: Processing knowledgeBase node for workflow {workflow_id}")
                        print(f"DEBUG: Current output for embedding search: {current_output}")
                        
                        # Try to get query embedding - determine which embedding model and API key to use
                        embedding_model = node_config.get("embeddingModel", "all-MiniLM-L6-v2")  # Default to HuggingFace model
                        embedding_api_key = None
                        
                        # Check for API key in node config first
                        embedding_api_key = node_config.get("apiKey")  # Knowledge Base nodes store API key in apiKey field
                        
                        if embedding_model == "all-MiniLM-L6-v2":
                            if not embedding_api_key:
                                embedding_api_key = stored_api_keys.get("huggingface")
                        else:
                            if not embedding_api_key:
                                embedding_api_key = stored_api_keys.get("openai")
                        
                        print(f"DEBUG: Using embedding model: {embedding_model}")
                        print(f"DEBUG: API key available: {bool(embedding_api_key)}")
                        
                        try:
                            from app.services.ai_service import AIService
                            ai_service = AIService()
                            if embedding_api_key:
                                query_embedding = await ai_service.generate_embeddings(
                                    current_output, 
                                    model=embedding_model, 
                                    api_key=embedding_api_key
                                )
                                print(f"DEBUG: Generated embedding: {bool(query_embedding)}")
                        except Exception as e:
                            print(f"DEBUG: Could not generate embeddings: {e}")
                        
                        # Always try to get documents first (more reliable)
                        print(f"DEBUG: Getting all documents for workflow: {workflow_id}")
                        try:
                            all_results = collection.get(
                                where={"workflow_id": workflow_id}
                            )
                            print(f"DEBUG: Documents retrieval successful: {bool(all_results and all_results['documents'])}")
                            
                            if all_results and all_results['documents']:
                                # Use all documents as context (they're already chunked appropriately)
                                relevant_content = "\n\n".join(all_results['documents'])
                                context["knowledge_context"] = all_results['documents']
                                print(f"DEBUG: Document context set, total length: {len(relevant_content)}")
                                
                                # If we have embeddings, try to search for most relevant parts
                                if query_embedding:
                                    try:
                                        print(f"DEBUG: Attempting embedding search for workflow: {workflow_id}")
                                        results = collection.query(
                                            query_embeddings=[query_embedding],
                                            n_results=3,
                                            where={"workflow_id": workflow_id}
                                        )
                                        
                                        if results and results['documents'] and results['documents'][0]:
                                            # Use semantic search results if available
                                            relevant_content = "\n\n".join(results['documents'][0])
                                            context["knowledge_context"] = results['documents'][0]
                                            print(f"DEBUG: Using semantic search results, length: {len(relevant_content)}")
                                        
                                    except Exception as e:
                                        print(f"DEBUG: Embedding search failed (dimension mismatch), using all documents: {e}")
                                        # Keep using all documents as fallback
                                
                            else:
                                print(f"DEBUG: No documents found for workflow: {workflow_id}")
                                
                        except Exception as e:
                            print(f"DEBUG: Could not retrieve documents: {e}")
                    except Exception as e:
                        print(f"DEBUG: Knowledge Base processing failed: {e}")
                        # Continue without knowledge base context
            elif node_type == "llmEngine":
                model = node_config.get("model", "gpt-3.5-turbo")
                system_prompt = node_config.get("systemPrompt", "You are a helpful assistant.")
                
                print(f"DEBUG LLM Engine: model={model}")
                print(f"DEBUG LLM Engine: stored_api_keys available: {list(stored_api_keys.keys())}")
                
                # Get API key - prefer node config, fallback to stored key based on model type
                llm_api_key = node_config.get("apiKey")
                print(f"DEBUG LLM Engine: node_config apiKey={llm_api_key}")
                
                if not llm_api_key:
                    # Determine API key type based on model
                    if model.startswith("gpt-") or model.startswith("text-") or model.startswith("davinci"):
                        llm_api_key = stored_api_keys.get("openai")
                        print(f"DEBUG LLM Engine: Detected OpenAI model, using openai key: {bool(llm_api_key)}")
                    elif model.startswith("gemini-") or "gemini" in model.lower() or "flash" in model.lower():
                        llm_api_key = stored_api_keys.get("gemini")
                        print(f"DEBUG LLM Engine: Detected Gemini model, using gemini key: {bool(llm_api_key)}")
                    else:
                        # Default to trying both
                        llm_api_key = stored_api_keys.get("gemini") or stored_api_keys.get("openai")
                        print(f"DEBUG LLM Engine: Unknown model, using fallback key: {bool(llm_api_key)}")
                
                print(f"DEBUG LLM Engine: Final API key available: {bool(llm_api_key)}")
                print(f"DEBUG LLM Engine: Model for AI service call: {model}")
                
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
                
                # Add document context to system prompt if available
                if "knowledge_context" in context and context["knowledge_context"]:
                    context_content = "\n\n".join(context["knowledge_context"])
                    print(f"DEBUG: Adding document context to LLM, length: {len(context_content)}")
                    system_prompt += f"\n\n=== DOCUMENT CONTENT ===\nThe following content is from documents that the user has uploaded and wants to discuss. This is the actual content from their documents:\n\n{context_content}\n\n=== END DOCUMENT CONTENT ===\n\nBased on the document content above, please provide accurate and detailed responses to the user's questions. Always reference specific parts of the document when answering."
                else:
                    print(f"DEBUG: No document context available for LLM")
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": current_output}
                ]
                
                print(f"DEBUG: About to call AI service with:")
                print(f"  model={model}")
                print(f"  api_key={'***' if llm_api_key else 'None'}")
                print(f"  temperature={node_config.get('temperature', 0.7)}")
                print(f"  max_tokens={node_config.get('maxTokens', 1000)}")
                
                response = await self.ai_service.generate_response(
                    messages=messages,
                    model=model,
                    temperature=node_config.get("temperature", 0.7),
                    max_tokens=node_config.get("maxTokens", 1000),
                    api_key=llm_api_key
                )
                
                print(f"DEBUG: AI service response: {response.get('content', 'No content')}")
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
