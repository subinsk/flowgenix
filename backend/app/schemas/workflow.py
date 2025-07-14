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
    status: Optional[str] = None


class WorkflowResponse(WorkflowBase):
    id: str
    user_id: str  # changed from int to str for UUID
    created_at: datetime
    updated_at: datetime
    status: Optional[str] = "draft"  # draft, ready, running, paused, completed, failed
    
    class Config:
        from_attributes = True
        json_encoders = {__import__('uuid').UUID: str}


class WorkflowBuildRequest(BaseModel):
    nodes: List[WorkflowNodeBase]
    edges: List[WorkflowEdgeBase]


class WorkflowBuildResponse(BaseModel):
    success: bool
    message: str
    errors: Optional[List[str]] = None
    execution_plan: Optional[Dict[str, Any]] = None


class WorkflowExecuteRequest(BaseModel):
    query: str


class WorkflowExecuteResponse(BaseModel):
    execution_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    message: str


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    size: int
    content_type: str
    processed: bool
    embeddings_count: Optional[int] = None
    query: str
    search_provider: Optional[str] = "brave"


class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    status: str
