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
from app.services.api_key_service import ApiKeyService
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
        self.api_key_service = ApiKeyService(db) if db else None
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_document(self, file: UploadFile, user_id: str, embedding_model: str = "text-embedding-ada-002", api_key: str = None) -> Document:
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

        # Process document asynchronously with specified model and API key
        await self._process_document(db_document, embedding_model, api_key)

        return db_document

    async def extract_text(self, document_id: str) -> str:
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

    async def _process_document(self, document: Document, embedding_model: str = "text-embedding-ada-002", api_key: str = None):
        """Process document: extract text and generate embeddings with selected model and key"""
        try:
            # Extract text
            text = await self._extract_text_from_file(document.file_path)
            
            # Get API key if not provided
            final_api_key = api_key
            if not final_api_key and self.api_key_service and document.user_id:
                # Determine which API key to use based on embedding model
                if embedding_model == "all-MiniLM-L6-v2":
                    final_api_key = self.api_key_service.get_decrypted_api_key(str(document.user_id), "huggingface")
                else:
                    final_api_key = self.api_key_service.get_decrypted_api_key(str(document.user_id), "openai")
            
            # Generate embeddings with model and key
            ai_service = AIService()
            embeddings = await ai_service.generate_embeddings(text, model=embedding_model, api_key=final_api_key)
            if embeddings:
                # Store in ChromaDB
                collection = self._get_or_create_collection()
                collection.add(
                    documents=[text],
                    metadatas=[{
                        "document_id": str(document.id),
                        "filename": document.filename,
                        "user_id": str(document.user_id),
                        "workflow_id": str(document.workflow_id) if document.workflow_id else None
                    }],
                    ids=[str(document.id)],
                    embeddings=[embeddings]
                )
                # Mark as processed only if embeddings were successfully generated and stored
                if self.db:
                    document.processed = True
                    self.db.commit()
                print(f"Successfully processed document {document.id} with {embedding_model}")
            else:
                # Don't mark as processed if embedding generation failed
                print(f"Failed to generate embeddings for document {document.id} using {embedding_model}")
                if embedding_model == "all-MiniLM-L6-v2" and final_api_key:
                    print("Note: HuggingFace sentence-transformers models currently have issues with the Inference API")
                    print("Consider using OpenAI embeddings (text-embedding-ada-002) as an alternative")
                elif not final_api_key:
                    print(f"No API key available for {embedding_model}")
        except Exception as e:
            print(f"Error processing document {document.id}: {str(e)}")
            # Don't mark as processed if there was an error

    async def search_documents_by_user(self, query: str, user_id: str, limit: int = 5, embedding_model: str = "all-MiniLM-L6-v2") -> List[Dict[str, Any]]:
        """Search documents using vector similarity"""
        try:
            # Generate query embedding using the same model as documents
            ai_service = AIService()
            
            # Get API key if needed
            api_key = None
            if self.api_key_service and embedding_model == "all-MiniLM-L6-v2":
                api_key = self.api_key_service.get_decrypted_api_key(user_id, "huggingface")
            elif self.api_key_service and embedding_model.startswith("text-embedding"):
                api_key = self.api_key_service.get_decrypted_api_key(user_id, "openai")
            
            query_embedding = await ai_service.generate_embeddings(query, model=embedding_model, api_key=api_key)
            
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
                    "document_id": str(doc_id),
                    "content": results['documents'][0][i][:500] + "...",
                    "similarity": 1 - results['distances'][0][i],
                    "metadata": results['metadatas'][0][i]
                })

            return search_results

        except Exception as e:
            print(f"Error searching documents: {str(e)}")
            return []

    async def search_documents(self, query: str, document_ids: List[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search documents for workflow execution"""
        try:
            # Generate embedding for query
            ai_service = AIService()
            query_embedding = await ai_service.generate_embeddings(query)
            
            if not query_embedding:
                return []

            # Search in ChromaDB
            collection = self._get_or_create_collection()
            
            # Build where clause
            where_clause = {}
            if document_ids:
                where_clause["document_id"] = {"$in": document_ids}
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where=where_clause if where_clause else None
            )

            # Format results for workflow
            search_results = []
            for i, doc_id in enumerate(results['ids'][0]):
                search_results.append({
                    "id": doc_id,
                    "content": results['documents'][0][i],
                    "similarity": 1 - results['distances'][0][i],
                    "metadata": results['metadatas'][0][i] or {}
                })

            return search_results

        except Exception as e:
            print(f"Error searching documents for workflow: {str(e)}")
            return []

    async def process_document(self, file: UploadFile, workflow_id: str, user_id: str) -> Dict[str, Any]:
        """Process and store document for workflow"""
        try:
            # Save and process document
            content = await file.read()
            
            # Extract text content
            text_content = ""
            if file.content_type == "application/pdf":
                text_content = await self._extract_pdf_text(content)
            elif file.content_type.startswith("text/"):
                text_content = content.decode('utf-8')
            else:
                raise ValueError(f"Unsupported file type: {file.content_type}")
            
            # Generate embeddings
            ai_service = AIService()
            embeddings = await ai_service.generate_embeddings(text_content)
            
            if embeddings:
                # Store in ChromaDB
                collection = self._get_or_create_collection()
                doc_id = f"{workflow_id}_{file.filename}_{hash(text_content)}"
                
                collection.add(
                    documents=[text_content],
                    embeddings=[embeddings],
                    metadatas=[{
                        "filename": file.filename,
                        "workflow_id": workflow_id,
                        "user_id": user_id,
                        "content_type": file.content_type,
                        "size": len(content)
                    }],
                    ids=[doc_id]
                )
            
            return {
                "id": doc_id,
                "filename": file.filename,
                "size": len(content),
                "content_type": file.content_type,
                "processed": bool(embeddings),
                "embeddings_count": len(embeddings) if embeddings else 0
            }
            
        except Exception as e:
            raise ValueError(f"Failed to process document: {str(e)}")

    async def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            raise ValueError(f"Failed to extract PDF text: {str(e)}")

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

    def get_user_documents(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all documents for a user"""
        if not self.db:
            return []
        
        return self.db.query(Document).filter(
            Document.user_id == user_id
        ).offset(skip).limit(limit).all()
