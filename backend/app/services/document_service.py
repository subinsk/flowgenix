import os
import aiofiles
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile
import fitz  # PyMuPDF
import chromadb

from app.models.document import Document
from app.schemas.document import DocumentCreate
from app.services.ai_service import AIService
from app.core.config import settings


class DocumentService:
    def __init__(self, db: Session = None):
        self.db = db
        self.upload_dir = settings.upload_dir
        self.chroma_client = chromadb.HttpClient(
            host=settings.chroma_host, 
            port=settings.chroma_port
        )
        self.collection_name = "documents"
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_document(self, file: UploadFile, user_id: int) -> Document:
        """Upload and process document"""
        # Validate file type
        if not self._is_valid_file_type(file.filename):
            raise ValueError("Invalid file type")

        # Save file
        file_path = os.path.join(self.upload_dir, f"{user_id}_{file.filename}")
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        # Create database record
        document_data = DocumentCreate(
            filename=file.filename,
            content_type=file.content_type,
            file_size=len(content),
            file_path=file_path
        )

        db_document = Document(
            filename=document_data.filename,
            content_type=document_data.content_type,
            file_size=document_data.file_size,
            file_path=document_data.file_path,
            user_id=user_id
        )

        if self.db:
            self.db.add(db_document)
            self.db.commit()
            self.db.refresh(db_document)

        # Process document asynchronously
        await self._process_document(db_document)

        return db_document

    async def extract_text(self, document_id: int) -> str:
        """Extract text from document"""
        if not self.db:
            return ""

        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise ValueError("Document not found")

        return await self._extract_text_from_file(document.file_path)

    async def _extract_text_from_file(self, file_path: str) -> str:
        """Extract text from file based on type"""
        if file_path.endswith('.pdf'):
            return self._extract_pdf_text(file_path)
        elif file_path.endswith('.txt'):
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                return await f.read()
        else:
            return "Unsupported file type for text extraction"

    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            return f"Error extracting PDF text: {str(e)}"

    async def _process_document(self, document: Document):
        """Process document: extract text and generate embeddings"""
        try:
            # Extract text
            text = await self._extract_text_from_file(document.file_path)
            
            # Generate embeddings
            ai_service = AIService()
            embeddings = await ai_service.generate_embeddings(text)
            
            if embeddings:
                # Store in ChromaDB
                collection = self._get_or_create_collection()
                collection.add(
                    documents=[text],
                    metadatas=[{
                        "document_id": document.id,
                        "filename": document.filename,
                        "user_id": document.user_id
                    }],
                    ids=[str(document.id)],
                    embeddings=[embeddings]
                )
            
            # Mark as processed
            if self.db:
                document.processed = True
                self.db.commit()

        except Exception as e:
            print(f"Error processing document {document.id}: {str(e)}")

    async def search_documents(self, query: str, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """Search documents using vector similarity"""
        try:
            # Generate query embedding
            ai_service = AIService()
            query_embedding = await ai_service.generate_embeddings(query)
            
            if not query_embedding:
                return []

            # Search in ChromaDB
            collection = self._get_or_create_collection()
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where={"user_id": user_id}
            )

            # Format results
            search_results = []
            for i, doc_id in enumerate(results['ids'][0]):
                search_results.append({
                    "document_id": int(doc_id),
                    "content": results['documents'][0][i][:500] + "...",
                    "similarity": 1 - results['distances'][0][i],
                    "metadata": results['metadatas'][0][i]
                })

            return search_results

        except Exception as e:
            print(f"Error searching documents: {str(e)}")
            return []

    def _get_or_create_collection(self):
        """Get or create ChromaDB collection"""
        try:
            return self.chroma_client.get_collection(self.collection_name)
        except:
            return self.chroma_client.create_collection(self.collection_name)

    def _is_valid_file_type(self, filename: str) -> bool:
        """Check if file type is allowed"""
        if not filename:
            return False
        
        file_ext = os.path.splitext(filename)[1].lower()
        return file_ext in settings.allowed_file_types

    def get_user_documents(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all documents for a user"""
        if not self.db:
            return []
        
        return self.db.query(Document).filter(
            Document.user_id == user_id
        ).offset(skip).limit(limit).all()
