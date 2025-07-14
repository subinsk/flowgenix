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
                
                # Enhanced Web search integration
                webSearchEnabled = node_config.get("webSearchEnabled", False)
                
                if webSearchEnabled:
                    search_provider = "serpapi"  # Default to serpapi for web search
                    search_api_key = node_config.get("serpApiKey") or stored_api_keys.get("serpapi")
                    
                    if search_api_key:
                        # Enhanced web search: Identify items from documents and fetch prices
                        search_results, enhanced_sources = await self._perform_enhanced_web_search(
                            query=current_output,
                            context=context,
                            search_provider=search_provider,
                            search_api_key=search_api_key
                        )
                        
                        if search_results:
                            context["search_results"] = search_results
                            
                            # Store enhanced sources for frontend display (max 2-3 sources)
                            if enhanced_sources:
                                context["search_sources"] = enhanced_sources[:3]  # Limit to 3 sources
                            
                            # Use enhanced formatting from search service
                            search_context = self.search_service.format_search_results_for_llm(
                                results=search_results,
                                search_analysis=None,
                                max_results=5
                            )
                            
                            system_prompt += f"\n\n{search_context}"
                            print(f"DEBUG: Added {len(search_results)} search results to context with {len(enhanced_sources) if enhanced_sources else 0} enhanced sources")
                        else:
                            print(f"DEBUG: No search results found for query: '{current_output}'")
                    else:
                        print(f"DEBUG: No API key available for {search_provider} search")
                
                # Add document context to system prompt if available
                if "knowledge_context" in context and context["knowledge_context"]:
                    context_content = "\n\n".join(context["knowledge_context"])
                    print(f"DEBUG: Adding document context to LLM, length: {len(context_content)}")
                    
                    # Enhanced prompt when we have both documents and web search
                    if webSearchEnabled and "search_results" in context:
                        system_prompt += f"""

=== DOCUMENT CONTENT ===
The following content is from documents that the user has uploaded:

{context_content}

=== END DOCUMENT CONTENT ===

🔍 **ENHANCED ANALYSIS INSTRUCTIONS:**
You have both document content and current web search results available. When responding:

1. **Identify items/products** mentioned in the documents that the user is asking about
2. **Provide current pricing** and purchase information from the web search results
3. **Compare options** if multiple products or vendors are found
4. **Reference specific sources** for price and availability information
5. **Combine document insights** with current market information

Focus on being helpful with actionable information including:
- Current prices and where to buy
- Product specifications from documents
- Comparison between options
- Recommendations based on both sources

Always cite your sources and distinguish between document information and current web data."""
                    else:
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
        
        # Add search sources to result if available
        if "search_sources" in context:
            result["search_sources"] = context["search_sources"]
            
        return convert_uuids(result)

    async def _perform_enhanced_web_search(self, query: str, context: Dict[str, Any], search_provider: str, search_api_key: str) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Enhanced web search that identifies items from documents and fetches targeted information
        Returns: (search_results, enhanced_sources)
        """
        enhanced_sources = []
        
        # Step 1: Check if we have document context to identify items
        document_context = context.get("knowledge_context", [])
        identified_items = []
        
        if document_context:
            # Analyze documents to identify products, items, or entities
            identified_items = await self._identify_items_from_documents(document_context, query)
            print(f"DEBUG Enhanced Search: Identified {len(identified_items)} items from documents")
        
        # Step 2: Determine search strategy
        if identified_items:
            # Enhanced search for identified items (focus on prices and details)
            search_results = []
            
            for item in identified_items[:3]:  # Limit to top 3 items
                item_query = f"{item} price buy where to purchase 2024"
                print(f"DEBUG Enhanced Search: Searching for item: '{item_query}'")
                
                item_results = await self.search_service.search(
                    query=item_query,
                    provider=search_provider,
                    num_results=3,
                    api_key=search_api_key
                )
                
                if item_results:
                    # Filter and enhance results for this item
                    enhanced_item_results = await self._enhance_search_results_for_item(item, item_results)
                    search_results.extend(enhanced_item_results)
                    
                    # Create enhanced sources for frontend display
                    for result in enhanced_item_results[:2]:  # Max 2 sources per item
                        enhanced_sources.append({
                            "title": result.get("title", ""),
                            "url": result.get("url", ""),
                            "description": f"Price information for {item}",
                            "snippet": result.get("snippet", "")
                        })
        else:
            # Fallback to standard search if no items identified
            print(f"DEBUG Enhanced Search: No items identified, performing standard search")
            search_results = await self.search_service.search(
                query=query,
                provider=search_provider,
                num_results=5,
                api_key=search_api_key
            )
            
            # Create sources from standard results
            for result in search_results[:3]:  # Max 3 sources
                enhanced_sources.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "description": result.get("snippet", "")[:100] + "..." if len(result.get("snippet", "")) > 100 else result.get("snippet", ""),
                    "snippet": result.get("snippet", "")
                })
        
        return search_results, enhanced_sources

    async def _identify_items_from_documents(self, document_context: List[str], query: str) -> List[str]:
        """
        Identify products, items, or entities from document context that might need price information
        """
        import re
        
        # Combine all document content
        full_text = " ".join(document_context).lower()
        query_lower = query.lower()
        
        # Patterns to identify potential items/products
        item_patterns = [
            # Product names with models/versions
            r'\b[A-Z][a-zA-Z]*\s+[A-Z0-9][a-zA-Z0-9]*\b',
            # Brand + product patterns
            r'\b(?:iPhone|iPad|MacBook|Samsung|Dell|HP|Lenovo|Microsoft|Google|Amazon|Apple)\s+[a-zA-Z0-9\s]+?\b',
            # Generic product categories
            r'\b(?:laptop|computer|phone|tablet|monitor|keyboard|mouse|headphones|camera|printer)\b',
            # Software/services
            r'\b(?:software|app|application|service|tool|platform|subscription)\s+[a-zA-Z]+\b'
        ]
        
        identified_items = set()
        
        # Extract potential items using patterns
        for pattern in item_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, str) and len(match.strip()) > 2:
                    identified_items.add(match.strip())
        
        # Also look for items mentioned in the query
        query_words = query_lower.split()
        for word in query_words:
            if len(word) > 3:  # Skip short words
                # Check if this word appears in document context
                if word in full_text:
                    # Look for surrounding context to build item name
                    for doc in document_context:
                        if word in doc.lower():
                            # Extract a few words around the match
                            words = doc.split()
                            for i, doc_word in enumerate(words):
                                if word in doc_word.lower():
                                    # Take up to 3 words around the match
                                    start = max(0, i-1)
                                    end = min(len(words), i+3)
                                    potential_item = " ".join(words[start:end])
                                    if len(potential_item.strip()) > 3:
                                        identified_items.add(potential_item.strip())
        
        # Filter and clean identified items
        cleaned_items = []
        for item in identified_items:
            # Skip very common words
            if item.lower() not in ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']:
                cleaned_items.append(item)
        
        return list(cleaned_items)[:5]  # Return top 5 items

    async def _enhance_search_results_for_item(self, item: str, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enhance search results for a specific item by prioritizing price and purchase information
        """
        enhanced_results = []
        
        # Keywords that indicate price/purchase information
        price_keywords = ['price', 'cost', 'buy', 'purchase', 'sale', 'deal', 'offer', '$', 'usd', 'cheap', 'expensive']
        vendor_keywords = ['amazon', 'ebay', 'walmart', 'target', 'bestbuy', 'newegg', 'apple', 'microsoft']
        
        for result in search_results:
            title = result.get("title", "").lower()
            snippet = result.get("snippet", "").lower()
            url = result.get("url", "").lower()
            
            # Calculate relevance score for this item
            relevance_score = 0
            
            # Check for item name in title/snippet
            if item.lower() in title:
                relevance_score += 3
            if item.lower() in snippet:
                relevance_score += 2
            
            # Check for price indicators
            price_score = sum(1 for keyword in price_keywords if keyword in title or keyword in snippet)
            relevance_score += price_score * 2
            
            # Check for known vendors
            vendor_score = sum(1 for keyword in vendor_keywords if keyword in url or keyword in title)
            relevance_score += vendor_score
            
            # Add enhanced metadata
            enhanced_result = result.copy()
            enhanced_result["relevance_score"] = relevance_score
            enhanced_result["item_name"] = item
            enhanced_result["enhanced_for"] = "price_search"
            
            enhanced_results.append(enhanced_result)
        
        # Sort by relevance score and return top results
        enhanced_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return enhanced_results

    def _enhance_system_prompt_for_search(self, base_prompt: str, search_analysis: Dict[str, Any], has_search_results: bool) -> str:
        """Enhance system prompt based on search analysis"""
        if not search_analysis or not has_search_results:
            return base_prompt
        
        search_type = search_analysis.get("search_type", "general")
        
        if search_type == "current_info":
            enhancement = """
You have access to current web information. Your responses should:
- Focus on the most recent and up-to-date information available
- Mention timeframes and dates when relevant
- Highlight any breaking news or recent developments
- Use phrases like "As of 2024" or "Recent information shows" when appropriate"""

        elif search_type == "factual":
            enhancement = """
You have access to factual web information. Your responses should:
- Provide accurate, well-sourced information
- Focus on established facts and verified data
- Reference authoritative sources when possible
- Distinguish between facts and opinions"""

        elif search_type == "analysis":
            enhancement = """
You have access to comparative web information. Your responses should:
- Provide balanced analysis from multiple perspectives
- Compare different viewpoints or options
- Highlight pros and cons when relevant
- Support conclusions with evidence from multiple sources"""

        else:
            enhancement = """
You have access to current web information. Use the search results to provide comprehensive, accurate responses."""

        return base_prompt + enhancement
