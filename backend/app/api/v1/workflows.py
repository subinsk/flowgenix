from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.workflow import Workflow, WorkflowExecution
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.schemas.workflow import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse, 
    WorkflowExecuteRequest, WorkflowExecuteResponse,
    WorkflowBuildRequest, WorkflowBuildResponse
)
from app.services.workflow_service import WorkflowService
from app.services.document_service import DocumentService
from app.services.api_key_service import ApiKeyService

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    db_workflow = Workflow(
        id=str(uuid.uuid4()),
        name=workflow.name,
        description=workflow.description,
        user_id=current_user.id,
        nodes=workflow.nodes,
        edges=workflow.edges,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return WorkflowResponse(
        id=str(db_workflow.id),
        user_id=str(db_workflow.user_id),
        name=db_workflow.name,
        description=db_workflow.description,
        nodes=db_workflow.nodes,
        edges=db_workflow.edges,
        created_at=db_workflow.created_at,
        updated_at=db_workflow.updated_at,
        status=getattr(db_workflow, 'status', 'draft')
    )


@router.get("/", response_model=List[WorkflowResponse])
async def get_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all workflows for the current user"""
    workflows = db.query(Workflow).filter(Workflow.user_id == current_user.id).all()
    return [
        WorkflowResponse(
            id=str(w.id),
            user_id=str(w.user_id),
            name=w.name,
            description=w.description,
            nodes=w.nodes,
            edges=w.edges,
            created_at=w.created_at,
            updated_at=w.updated_at,
            status=getattr(w, 'status', 'draft')
        ) for w in workflows
    ]


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return WorkflowResponse(
        id=str(workflow.id),
        user_id=str(workflow.user_id),
        name=workflow.name,
        description=workflow.description,
        nodes=workflow.nodes,
        edges=workflow.edges,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        status=getattr(workflow, 'status', 'draft')
    )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    for field, value in workflow_update.dict(exclude_unset=True).items():
        setattr(workflow, field, value)
    
    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    
    return WorkflowResponse(
        id=str(workflow.id),
        user_id=str(workflow.user_id),
        name=workflow.name,
        description=workflow.description,
        nodes=workflow.nodes,
        edges=workflow.edges,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        status=getattr(workflow, 'status', 'draft')
    )


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    return {"message": "Workflow deleted successfully"}


@router.post("/{workflow_id}/build", response_model=WorkflowBuildResponse)
async def build_workflow(
    workflow_id: str,
    build_request: WorkflowBuildRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Build and validate a workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow_service = WorkflowService(db)
    
    try:
        # Validate workflow structure
        validation_result = await workflow_service.validate_workflow(
            build_request.nodes, 
            build_request.edges
        )
        
        if not validation_result.is_valid:
            return WorkflowBuildResponse(
                success=False,
                errors=validation_result.errors,
                message="Workflow validation failed"
            )
        
        # Build workflow execution plan
        execution_plan = await workflow_service.build_execution_plan(
            build_request.nodes,
            build_request.edges
        )
        
        # Update workflow with nodes/edges
        workflow.nodes = [node.dict() for node in build_request.nodes]
        workflow.edges = [edge.dict() for edge in build_request.edges]
        workflow.status = "ready"
        workflow.updated_at = datetime.utcnow()
        db.commit()
        
        return WorkflowBuildResponse(
            success=True,
            message="Workflow built successfully",
            execution_plan=execution_plan
        )
        
    except Exception as e:
        return WorkflowBuildResponse(
            success=False,
            errors=[str(e)],
            message="Failed to build workflow"
        )


@router.post("/{workflow_id}/execute", response_model=WorkflowExecuteResponse)
async def execute_workflow(
    workflow_id: str,
    execute_request: WorkflowExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow with user query"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != "ready":
        raise HTTPException(status_code=400, detail="Workflow must be in ready status before execution")
    
    # Create execution record
    execution = WorkflowExecution(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        user_id=current_user.id,
        status="running",
        input_query=execute_request.query,
        started_at=datetime.utcnow()
    )
    
    db.add(execution)
    db.commit()
    
    workflow_service = WorkflowService(db)
    
    try:
        # Execute workflow
        result = await workflow_service.execute_workflow(
            workflow.nodes,
            workflow.edges,
            execute_request.query,
            execution.id,
            str(current_user.id),  # Pass user_id for API key retrieval
            workflow_id  # Pass workflow_id for document retrieval
        )
        
        # Update execution record
        execution.status = "completed"
        execution.result = result
        execution.completed_at = datetime.utcnow()
        db.commit()
        
        return WorkflowExecuteResponse(
            execution_id=str(execution.id),
            status="completed",
            result=result,
            message="Workflow executed successfully"
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        execution.completed_at = datetime.utcnow()
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")


@router.post("/{workflow_id}/upload-documents")
async def upload_documents(
    workflow_id: str,
    files: List[UploadFile] = File(...),
    embedding_model: Optional[str] = None,
    api_key: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload documents for knowledge base component, with embedding model and API key support"""
    from app.models.document import Document
    from app.schemas.document import DocumentCreate
    from app.services.api_key_service import ApiKeyService
    import aiofiles
    import os
    from app.core.config import settings

    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Save provided API key for future use if present
    if api_key:
        key_name = "huggingface" if embedding_model == "all-MiniLM-L6-v2" else "openai"
        api_key_data = ApiKeyCreate(key_name=key_name, api_key=api_key)
        api_key_service.create_api_key(str(current_user.id), api_key_data)

    # Get stored API keys as fallback
    # Only get API key from database if not provided in request
    stored_api_key = None
    if not api_key:
        api_key_service = ApiKeyService(db)
        # Determine which API key to use based on embedding model
        if embedding_model == "all-MiniLM-L6-v2":
            stored_api_key = api_key_service.get_decrypted_api_key(str(current_user.id), "huggingface")
        else:
            stored_api_key = api_key_service.get_decrypted_api_key(str(current_user.id), "openai")
    
    final_api_key = api_key or stored_api_key

    document_service = DocumentService(db)
    uploaded_files = []
    try:
        for file in files:
            # Save file to disk
            file_path = os.path.join(settings.upload_dir, f"{current_user.id}_{file.filename}")
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            # Create DB record
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
                user_id=current_user.id,
                workflow_id=workflow_id  # Associate document with workflow
            )
            db.add(db_document)
            db.commit()
            db.refresh(db_document)
            # Process document (extract text, generate embeddings)
            await document_service._process_document(db_document, embedding_model or "text-embedding-ada-002", final_api_key)
            uploaded_files.append({
                "id": str(db_document.id),
                "filename": db_document.filename,
                "content_type": db_document.content_type,
                "file_size": db_document.file_size,
                "file_path": db_document.file_path
            })
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} documents",
            "files": uploaded_files
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload documents: {str(e)}")


@router.get("/{workflow_id}/documents")
async def get_workflow_documents(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents uploaded for a specific workflow"""
    from app.models.document import Document
    
    # Verify workflow exists and belongs to user
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Get documents for this specific workflow
    documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.workflow_id == workflow_id
    ).all()
    
    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "content_type": doc.content_type,
            "file_size": doc.file_size,
            "file_path": doc.file_path,
            "upload_date": doc.upload_date.isoformat(),
            "processed": doc.processed
        }
        for doc in documents
    ]


@router.get("/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get execution history for a workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    executions = db.query(WorkflowExecution).filter(
        WorkflowExecution.workflow_id == workflow_id
    ).order_by(WorkflowExecution.started_at.desc()).all()
    
    return [
        {
            "id": execution.id,
            "status": execution.status,
            "input_query": execution.input_query,
            "result": execution.result,
            "started_at": execution.started_at,
            "completed_at": execution.completed_at,
            "error_message": execution.error_message
        }
        for execution in executions
    ]


@router.get("/executions/{execution_id}")
async def get_execution_status(
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get execution status"""
    status_info = execution_engine.get_execution_status(execution_id)
    
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # Check if user owns this execution
    if status_info.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return status_info
