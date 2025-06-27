from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatMessageBase(BaseModel):
    content: str
    role: str  # "user" or "assistant"


class ChatMessageCreate(ChatMessageBase):
    session_id: str


class ChatMessageResponse(ChatMessageBase):
    id: str
    session_id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {__import__('uuid').UUID: str}


class ChatSessionBase(BaseModel):
    workflow_id: Optional[str] = None
    title: Optional[str] = None


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionResponse(ChatSessionBase):
    id: str
    user_id: str
    created_at: datetime
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True
        json_encoders = {__import__('uuid').UUID: str}


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    workflow_id: Optional[str] = None
