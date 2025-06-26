from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class WorkflowNodeBase(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]


class WorkflowEdgeBase(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[WorkflowNodeBase]
    edges: List[WorkflowEdgeBase]


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[WorkflowNodeBase]] = None
    edges: Optional[List[WorkflowEdgeBase]] = None


class WorkflowResponse(WorkflowBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WorkflowExecutionRequest(BaseModel):
    workflow: WorkflowBase
    query: str
    search_provider: Optional[str] = "brave"


class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    status: str
