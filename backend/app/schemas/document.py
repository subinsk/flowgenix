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
    id: str  # changed from int to str for UUID
    user_id: str  # changed from int to str for UUID
    file_path: str
    upload_date: datetime
    processed: bool = False
    
    class Config:
        from_attributes = True
        json_encoders = {__import__('uuid').UUID: str}


class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str  # changed from int to str for UUID
    filename: str


class TextExtractionRequest(BaseModel):
    document_id: str  # changed from int to str for UUID


class TextExtractionResponse(BaseModel):
    text: str
    document_id: str  # changed from int to str for UUID
