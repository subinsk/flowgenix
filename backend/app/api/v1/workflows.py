from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.workflow import (
    WorkflowCreate, 
    WorkflowUpdate, 
    WorkflowResponse,
    WorkflowExecutionRequest,
    WorkflowExecutionResponse
)
from app.services.workflow_service import WorkflowService
from app.services.execution_service import execution_engine
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new workflow"""
    workflow_service = WorkflowService(db)
    return workflow_service.create_workflow(current_user.id, workflow_data)


@router.get("/", response_model=List[WorkflowResponse])
async def get_workflows(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workflows"""
    workflow_service = WorkflowService(db)
    return workflow_service.get_user_workflows(current_user.id, skip, limit)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific workflow"""
    workflow_service = WorkflowService(db)
    workflow = workflow_service.get_workflow(workflow_id, current_user.id)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update workflow"""
    workflow_service = WorkflowService(db)
    workflow = workflow_service.update_workflow(workflow_id, current_user.id, workflow_data)
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return workflow


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete workflow"""
    workflow_service = WorkflowService(db)
    success = workflow_service.delete_workflow(workflow_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return {"message": "Workflow deleted successfully"}


@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    execution_request: WorkflowExecutionRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow"""
    try:
        execution_id = await execution_engine.execute_workflow(
            workflow=execution_request.workflow.dict(),
            query=execution_request.query,
            user_id=current_user.id
        )
        
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            status="started"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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
