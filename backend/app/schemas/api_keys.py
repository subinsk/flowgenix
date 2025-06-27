from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ApiKeyCreate(BaseModel):
    key_name: str
    api_key: str


class ApiKeyUpdate(BaseModel):
    api_key: str


class ApiKeyResponse(BaseModel):
    id: str
    key_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ApiKeysListResponse(BaseModel):
    api_keys: list[ApiKeyResponse]
