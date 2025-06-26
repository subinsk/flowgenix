import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from app.services.ai_service import AIService
from app.services.document_service import DocumentService
from app.services.search_service import SearchService
from app.core.config import settings
from app.utils.websocket_manager import WebSocketManager


class ExecutionEngine:
    def __init__(self):
        self.active_executions: Dict[str, Dict] = {}
        self.websocket_manager = WebSocketManager()

    async def execute_workflow(self, workflow: Dict[str, Any], query: str, user_id: int) -> str:
        """Execute a workflow with real-time progress tracking"""
        execution_id = str(uuid.uuid4())
        
        # Initialize execution state
        self.active_executions[execution_id] = {
            "status": "running",
            "progress": 0,
            "current_step": "Starting execution",
            "started_at": datetime.utcnow(),
            "workflow": workflow,
            "query": query,
            "user_id": user_id,
            "result": None
        }

        # Start execution in background
        asyncio.create_task(self._execute_workflow_async(execution_id))
        
        return execution_id

    async def _execute_workflow_async(self, execution_id: str):
        """Execute workflow asynchronously with progress updates"""
        try:
            execution = self.active_executions[execution_id]
            workflow = execution["workflow"]
            query = execution["query"]
            user_id = execution["user_id"]

            # Step 1: Validate workflow
            await self._emit_progress(execution_id, 10, "Validating workflow structure")
            if not self._validate_workflow(workflow):
                raise ValueError("Invalid workflow structure")

            # Step 2: Process nodes in order
            nodes = workflow.get("nodes", [])
            edges = workflow.get("edges", [])
            
            # Build execution order
            execution_order = self._get_execution_order(nodes, edges)
            
            context = {"query": query, "user_id": user_id}
            
            for i, node_id in enumerate(execution_order):
                node = next((n for n in nodes if n["id"] == node_id), None)
                if not node:
                    continue

                progress = 20 + (i * 60 // len(execution_order))
                await self._emit_progress(execution_id, progress, f"Processing {node['type']} node")
                
                # Execute node
                result = await self._execute_node(node, context)
                context[node_id] = result

            # Step 3: Generate final result
            await self._emit_progress(execution_id, 90, "Generating final result")
            final_result = self._generate_final_result(context)

            # Step 4: Complete execution
            await self._emit_progress(execution_id, 100, "Execution completed")
            
            execution["status"] = "completed"
            execution["result"] = final_result
            execution["completed_at"] = datetime.utcnow()

            await self._emit_completion(execution_id, final_result)

        except Exception as e:
            execution = self.active_executions.get(execution_id, {})
            execution["status"] = "failed"
            execution["error"] = str(e)
            execution["completed_at"] = datetime.utcnow()
            
            await self._emit_error(execution_id, str(e))

    async def _execute_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Any:
        """Execute a single workflow node"""
        node_type = node.get("type")
        node_data = node.get("data", {})

        if node_type == "userQuery":
            return context.get("query", "")
        
        elif node_type == "knowledgeBase":
            # Use document service to search knowledge base
            doc_service = DocumentService()
            return await doc_service.search_documents(context["query"], context["user_id"])
        
        elif node_type == "webSearch":
            # Use search service
            search_service = SearchService()
            provider = node_data.get("provider", "brave")
            return await search_service.search(context["query"], provider)
        
        elif node_type == "llmEngine":
            # Use AI service
            ai_service = AIService()
            prompt = self._build_llm_prompt(context, node_data)
            return await ai_service.generate_response(prompt)
        
        elif node_type == "output":
            # Format output
            return self._format_output(context, node_data)
        
        else:
            return f"Unknown node type: {node_type}"

    def _build_llm_prompt(self, context: Dict[str, Any], node_data: Dict[str, Any]) -> str:
        """Build LLM prompt from context"""
        prompt_parts = []
        
        # Add system prompt
        if "systemPrompt" in node_data:
            prompt_parts.append(f"System: {node_data['systemPrompt']}")
        
        # Add user query
        if "query" in context:
            prompt_parts.append(f"User Query: {context['query']}")
        
        # Add knowledge base results
        for key, value in context.items():
            if key.endswith("_knowledge") and value:
                prompt_parts.append(f"Knowledge Base: {value}")
            elif key.endswith("_search") and value:
                prompt_parts.append(f"Search Results: {value}")
        
        return "\n\n".join(prompt_parts)

    def _format_output(self, context: Dict[str, Any], node_data: Dict[str, Any]) -> str:
        """Format final output"""
        template = node_data.get("template", "{{result}}")
        
        # Simple template replacement
        result = template
        for key, value in context.items():
            if isinstance(value, str):
                result = result.replace(f"{{{{{key}}}}}", value)
        
        return result

    def _validate_workflow(self, workflow: Dict[str, Any]) -> bool:
        """Validate workflow structure"""
        nodes = workflow.get("nodes", [])
        edges = workflow.get("edges", [])
        
        if not nodes:
            return False
        
        # Check for required node types
        node_types = [node.get("type") for node in nodes]
        return "userQuery" in node_types and "output" in node_types

    def _get_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Get node execution order based on dependencies"""
        # Simple topological sort
        node_ids = [node["id"] for node in nodes]
        dependencies = {node_id: [] for node_id in node_ids}
        
        for edge in edges:
            source, target = edge["source"], edge["target"]
            if target in dependencies:
                dependencies[target].append(source)
        
        # Topological sort
        result = []
        visited = set()
        
        def visit(node_id):
            if node_id in visited:
                return
            visited.add(node_id)
            for dep in dependencies.get(node_id, []):
                visit(dep)
            result.append(node_id)
        
        for node_id in node_ids:
            visit(node_id)
        
        return result

    def _generate_final_result(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate final execution result"""
        return {
            "query": context.get("query", ""),
            "response": context.get("output", "No output generated"),
            "context": {k: v for k, v in context.items() if not k.startswith("_")},
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _emit_progress(self, execution_id: str, progress: int, message: str):
        """Emit progress update via WebSocket"""
        await self.websocket_manager.send_to_execution(execution_id, {
            "type": "progress",
            "execution_id": execution_id,
            "progress": progress,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def _emit_completion(self, execution_id: str, result: Dict[str, Any]):
        """Emit completion event"""
        await self.websocket_manager.send_to_execution(execution_id, {
            "type": "completed",
            "execution_id": execution_id,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def _emit_error(self, execution_id: str, error: str):
        """Emit error event"""
        await self.websocket_manager.send_to_execution(execution_id, {
            "type": "error",
            "execution_id": execution_id,
            "error": error,
            "timestamp": datetime.utcnow().isoformat()
        })

    def get_execution_status(self, execution_id: str) -> Optional[Dict]:
        """Get current execution status"""
        return self.active_executions.get(execution_id)


# Global execution engine instance
execution_engine = ExecutionEngine()
