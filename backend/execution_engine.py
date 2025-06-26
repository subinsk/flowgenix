"""
Workflow Execution Engine with Real-time Progress Tracking
"""
import asyncio
import json
import uuid
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import WorkflowExecution, ExecutionLog, User, Workflow
from database import SessionLocal
import logging

logger = logging.getLogger(__name__)

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class NodeType(str, Enum):
    USER_QUERY = "userQuery"
    KNOWLEDGE_BASE = "knowledgeBase"
    LLM_ENGINE = "llmEngine"
    WEB_SEARCH = "webSearch"
    OUTPUT = "output"

class ExecutionEvent(BaseModel):
    execution_id: str
    node_id: Optional[str] = None
    event_type: str
    message: str
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None
    progress: Optional[float] = None  # 0.0 to 1.0

class WorkflowExecutor:
    def __init__(self):
        self.active_executions: Dict[str, asyncio.Task] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
    
    def add_event_handler(self, execution_id: str, handler: Callable):
        """Add an event handler for an execution"""
        if execution_id not in self.event_handlers:
            self.event_handlers[execution_id] = []
        self.event_handlers[execution_id].append(handler)
    
    def remove_event_handlers(self, execution_id: str):
        """Remove all event handlers for an execution"""
        if execution_id in self.event_handlers:
            del self.event_handlers[execution_id]
    
    async def emit_event(self, event: ExecutionEvent):
        """Emit an execution event to all registered handlers"""
        # Log to database
        await self._log_to_database(event)
        
        # Notify WebSocket handlers
        handlers = self.event_handlers.get(event.execution_id, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                logger.error(f"Error in event handler: {e}")
    
    async def _log_to_database(self, event: ExecutionEvent):
        """Log execution event to database"""
        try:
            db = SessionLocal()
            log = ExecutionLog(
                execution_id=int(event.execution_id) if event.execution_id.isdigit() else None,
                event=json.dumps({
                    "type": event.event_type,
                    "message": event.message,
                    "node_id": event.node_id,
                    "data": event.data,
                    "progress": event.progress
                }),
                timestamp=event.timestamp
            )
            db.add(log)
            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to log to database: {e}")
    
    async def execute_workflow(self, workflow_data: Dict[str, Any], user_query: str, user_id: int) -> str:
        """Execute a workflow and return execution ID"""
        execution_id = str(uuid.uuid4())
        
        # Create execution record
        db = SessionLocal()
        try:
            execution = WorkflowExecution(
                workflow_id=workflow_data.get('id'),
                status=ExecutionStatus.PENDING,
                input_data={"query": user_query, "workflow": workflow_data}
            )
            db.add(execution)
            db.commit()
            db.refresh(execution)
            execution_id = str(execution.id)
        except Exception as e:
            logger.error(f"Failed to create execution record: {e}")
        finally:
            db.close()
        
        # Start execution task
        task = asyncio.create_task(self._execute_workflow_task(execution_id, workflow_data, user_query, user_id))
        self.active_executions[execution_id] = task
        
        return execution_id
    
    async def _execute_workflow_task(self, execution_id: str, workflow_data: Dict[str, Any], user_query: str, user_id: int):
        """Execute workflow in background task"""
        try:
            await self.emit_event(ExecutionEvent(
                execution_id=execution_id,
                event_type="execution_started",
                message="Workflow execution started",
                timestamp=datetime.now(),
                progress=0.0
            ))
            
            # Update execution status
            await self._update_execution_status(execution_id, ExecutionStatus.RUNNING)
            
            # Execute workflow nodes in order
            nodes = workflow_data.get('nodes', [])
            edges = workflow_data.get('edges', [])
            
            if not nodes:
                raise Exception("No nodes found in workflow")
            
            # Build execution order
            execution_order = self._build_execution_order(nodes, edges)
            total_nodes = len(execution_order)
            
            # Context to pass between nodes
            context = {"user_query": user_query, "user_id": user_id}
            
            # Execute each node
            for i, node_id in enumerate(execution_order):
                node = next((n for n in nodes if n['id'] == node_id), None)
                if not node:
                    continue
                
                progress = (i + 1) / total_nodes
                
                await self.emit_event(ExecutionEvent(
                    execution_id=execution_id,
                    node_id=node_id,
                    event_type="node_started",
                    message=f"Executing node: {node.get('data', {}).get('label', node_id)}",
                    timestamp=datetime.now(),
                    progress=progress * 0.9,  # Leave 10% for completion
                    data={"node_type": node.get('type'), "node_data": node.get('data')}
                ))
                
                # Execute node
                try:
                    result = await self._execute_node(node, context)
                    context[f"node_{node_id}_result"] = result
                    
                    await self.emit_event(ExecutionEvent(
                        execution_id=execution_id,
                        node_id=node_id,
                        event_type="node_completed",
                        message=f"Node completed: {node.get('data', {}).get('label', node_id)}",
                        timestamp=datetime.now(),
                        progress=progress * 0.9,
                        data={"result": result}
                    ))
                except Exception as e:
                    error_msg = f"Node failed: {str(e)}"
                    await self.emit_event(ExecutionEvent(
                        execution_id=execution_id,
                        node_id=node_id,
                        event_type="node_error",
                        message=error_msg,
                        timestamp=datetime.now(),
                        data={"error": str(e)}
                    ))
                    raise Exception(f"Node {node_id} failed: {str(e)}")
                
                # Small delay to make progress visible
                await asyncio.sleep(0.5)
            
            # Execution completed
            await self.emit_event(ExecutionEvent(
                execution_id=execution_id,
                event_type="execution_completed",
                message="Workflow execution completed successfully",
                timestamp=datetime.now(),
                progress=1.0,
                data={"final_context": context}
            ))
            
            await self._update_execution_status(execution_id, ExecutionStatus.COMPLETED, result=context)
            
        except Exception as e:
            error_msg = f"Execution failed: {str(e)}"
            logger.error(error_msg)
            
            await self.emit_event(ExecutionEvent(
                execution_id=execution_id,
                event_type="execution_error",
                message=error_msg,
                timestamp=datetime.now(),
                data={"error": str(e)}
            ))
            
            await self._update_execution_status(execution_id, ExecutionStatus.FAILED, error=str(e))
        
        finally:
            # Cleanup
            if execution_id in self.active_executions:
                del self.active_executions[execution_id]
    
    def _build_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Build execution order based on node connections"""
        # Simple topological sort
        # For now, just return nodes in order (can be enhanced with proper dependency resolution)
        return [node['id'] for node in nodes]
    
    async def _execute_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Any:
        """Execute a single node"""
        node_type = node.get('type')
        node_data = node.get('data', {})
        
        if node_type == NodeType.USER_QUERY:
            return await self._execute_user_query_node(node_data, context)
        elif node_type == NodeType.KNOWLEDGE_BASE:
            return await self._execute_knowledge_base_node(node_data, context)
        elif node_type == NodeType.LLM_ENGINE:
            return await self._execute_llm_node(node_data, context)
        elif node_type == NodeType.WEB_SEARCH:
            return await self._execute_web_search_node(node_data, context)
        elif node_type == NodeType.OUTPUT:
            return await self._execute_output_node(node_data, context)
        else:
            raise Exception(f"Unknown node type: {node_type}")
    
    async def _execute_user_query_node(self, node_data: Dict, context: Dict) -> str:
        """Execute user query node"""
        query = context.get('user_query', '')
        await asyncio.sleep(0.2)  # Simulate processing
        return query
    
    async def _execute_knowledge_base_node(self, node_data: Dict, context: Dict) -> Dict:
        """Execute knowledge base search node"""
        query = context.get('user_query', '')
        await asyncio.sleep(1.0)  # Simulate vector search
        
        # Mock knowledge base result
        return {
            "query": query,
            "documents": [
                {"content": "Sample document content relevant to the query", "score": 0.85},
                {"content": "Another relevant document", "score": 0.72}
            ]
        }
    
    async def _execute_llm_node(self, node_data: Dict, context: Dict) -> str:
        """Execute LLM processing node"""
        query = context.get('user_query', '')
        kb_result = context.get('node_knowledgeBase_result', {})
        
        await asyncio.sleep(2.0)  # Simulate LLM API call
        
        # Mock LLM response
        return f"Based on your query '{query}' and the knowledge base information, here's a comprehensive response with relevant insights."
    
    async def _execute_web_search_node(self, node_data: Dict, context: Dict) -> Dict:
        """Execute web search node"""
        query = context.get('user_query', '')
        provider = node_data.get('provider', 'brave')
        
        await asyncio.sleep(1.5)  # Simulate web search API call
        
        # Mock web search results
        return {
            "query": query,
            "provider": provider,
            "results": [
                {"title": "Relevant Web Result 1", "url": "https://example.com/1", "snippet": "Sample snippet"},
                {"title": "Relevant Web Result 2", "url": "https://example.com/2", "snippet": "Another snippet"}
            ]
        }
    
    async def _execute_output_node(self, node_data: Dict, context: Dict) -> str:
        """Execute output formatting node"""
        # Combine all results into final output
        final_output = "Workflow execution results:\n\n"
        
        for key, value in context.items():
            if key.startswith('node_') and key.endswith('_result'):
                final_output += f"{key}: {value}\n\n"
        
        await asyncio.sleep(0.3)  # Simulate formatting
        return final_output
    
    async def _update_execution_status(self, execution_id: str, status: ExecutionStatus, result: Any = None, error: str = None):
        """Update execution status in database"""
        try:
            db = SessionLocal()
            execution = db.query(WorkflowExecution).filter(WorkflowExecution.id == int(execution_id)).first()
            if execution:
                execution.status = status
                if result:
                    execution.result = result
                if error:
                    execution.error = error
                if status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
                    execution.completed_at = datetime.now()
                db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to update execution status: {e}")
    
    async def cancel_execution(self, execution_id: str):
        """Cancel a running execution"""
        if execution_id in self.active_executions:
            task = self.active_executions[execution_id]
            task.cancel()
            
            await self.emit_event(ExecutionEvent(
                execution_id=execution_id,
                event_type="execution_cancelled",
                message="Workflow execution was cancelled",
                timestamp=datetime.now()
            ))
            
            await self._update_execution_status(execution_id, ExecutionStatus.CANCELLED)

# Global executor instance
executor = WorkflowExecutor()
