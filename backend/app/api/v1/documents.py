from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.core.database import get_db
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    TextExtractionRequest,
    TextExtractionResponse
)
from app.services.document_service import DocumentService
from app.models.user import User
from app.models.document import Document
from app.utils.dependencies import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document"""
    try:
        document_service = DocumentService(db)
        document = await document_service.upload_document(file, current_user.id)
        
        return DocumentUploadResponse(
            message=f"File '{file.filename}' uploaded successfully",
            document_id=document.id,
            filename=document.filename
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's documents"""
    document_service = DocumentService(db)
    return document_service.get_user_documents(current_user.id, skip, limit)


@router.post("/extract-text", response_model=TextExtractionResponse)
async def extract_text(
    request: TextExtractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Extract text from document"""
    try:
        document_service = DocumentService(db)
        text = await document_service.extract_text(request.document_id)
        
        return TextExtractionResponse(
            text=text,
            document_id=request.document_id
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )


@router.post("/search")
async def search_documents(
    query: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search documents using vector similarity"""
    try:
        document_service = DocumentService(db)
        results = await document_service.search_documents(query, current_user.id, limit)
        
        return {
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a document file"""
    # Get document from database
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if file exists
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Return file response
    return FileResponse(
        path=document.file_path,
        filename=document.filename,
        media_type=document.content_type or 'application/octet-stream'
    )
