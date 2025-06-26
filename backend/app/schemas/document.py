from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentBase(BaseModel):
    filename: str
    content_type: str
    file_size: int


class DocumentCreate(DocumentBase):
    file_path: str


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    file_path: str
    upload_date: datetime
    processed: bool = False
    
    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    message: str
    document_id: int
    filename: str


class TextExtractionRequest(BaseModel):
    document_id: int


class TextExtractionResponse(BaseModel):
    text: str
    document_id: int
