import asyncio
import uuid
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import json
import logging
from enum import Enum
from pydantic import BaseModel

from app.services.ai_service import AIService
from app.services.document_service import DocumentService
from app.services.search_service import SearchService
from app.core.config import settings
from app.utils.websocket_manager import WebSocketManager
from app.models.workflow import WorkflowExecution
from app.models.document import ExecutionLog
from app.models.user import User
from app.core.database import SessionLocal


logger = logging.getLogger(__name__)

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ExecutionEvent(BaseModel):
    execution_id: str
    node_id: Optional[str] = None
    event_type: str
    message: str
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None
    progress: Optional[float] = None  # 0.0 to 1.0

class ExecutionEngine:
    def __init__(self):
        self.active_executions: Dict[str, asyncio.Task] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.websocket_manager = WebSocketManager()

    def add_event_handler(self, execution_id: str, handler: Callable):
        if execution_id not in self.event_handlers:
            self.event_handlers[execution_id] = []
        self.event_handlers[execution_id].append(handler)

    def remove_event_handlers(self, execution_id: str):
        if execution_id in self.event_handlers:
            del self.event_handlers[execution_id]

    async def emit_event(self, event: ExecutionEvent):
        await self._log_to_database(event)
        handlers = self.event_handlers.get(event.execution_id, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                logger.error(f"Error in event handler: {e}")
        # Also emit via websocket
        await self.websocket_manager.send_to_execution(event.execution_id, event.dict())

    async def _log_to_database(self, event: ExecutionEvent):
        try:
            db = SessionLocal()
            log = ExecutionLog(
                execution_id=event.execution_id,
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

    async def execute_workflow(self, workflow_data: Dict[str, Any], user_query: str, user_id: str) -> str:
        execution_id = str(uuid.uuid4())
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
        task = asyncio.create_task(self._execute_workflow_task(execution_id, workflow_data, user_query, user_id))
        self.active_executions[execution_id] = task
        return execution_id

    async def _execute_workflow_task(self, execution_id: str, workflow_data: Dict[str, Any], user_query: str, user_id: str):
        try:
            await self.emit_event(ExecutionEvent(
                execution_id=execution_id,
                event_type="execution_started",
                message="Workflow execution started",
                timestamp=datetime.now(),
                progress=0.0
            ))
            await self._update_execution_status(execution_id, ExecutionStatus.RUNNING)
            nodes = workflow_data.get('nodes', [])
            edges = workflow_data.get('edges', [])
            if not nodes:
                raise Exception("No nodes found in workflow")
            execution_order = self._build_execution_order(nodes, edges)
            total_nodes = len(execution_order)
            context = {"user_query": user_query, "user_id": user_id}
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
                    progress=progress * 0.9,
                    data={"node_type": node.get('type'), "node_data": node.get('data')}
                ))
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
                await asyncio.sleep(0.5)
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
            if execution_id in self.active_executions:
                del self.active_executions[execution_id]

    def _build_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        return [node['id'] for node in nodes]

    async def _execute_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Any:
        node_type = node.get('type')
        node_data = node.get('data', {})
        if node_type == "userQuery":
            return context.get('user_query', '')
        elif node_type == "knowledgeBase":
            doc_service = DocumentService()
            return await doc_service.search_documents(context["user_query"], context["user_id"])
        elif node_type == "webSearch":
            search_service = SearchService()
            provider = node_data.get('provider', 'brave')
            return await search_service.search(context["user_query"], provider)
        elif node_type == "llmEngine":
            ai_service = AIService()
            prompt = self._build_llm_prompt(context, node_data)
            return await ai_service.generate_response(prompt)
        elif node_type == "output":
            return self._format_output(context, node_data)
        else:
            raise Exception(f"Unknown node type: {node_type}")

    async def _update_execution_status(self, execution_id: str, status: ExecutionStatus, result: Any = None, error: str = None):
        try:
            db = SessionLocal()
            execution = db.query(WorkflowExecution).filter(WorkflowExecution.id == execution_id).first()
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

# Global execution engine instance
execution_engine = ExecutionEngine()
