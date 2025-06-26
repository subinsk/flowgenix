from sqlalchemy.orm import Session
from app.models.workflow import Workflow, WorkflowExecution
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate
from typing import List, Optional
import uuid
from datetime import datetime


class WorkflowService:
    def __init__(self, db: Session):
        self.db = db

    def create_workflow(self, user_id: int, workflow_data: WorkflowCreate) -> Workflow:
        """Create a new workflow"""
        db_workflow = Workflow(
            name=workflow_data.name,
            description=workflow_data.description,
            user_id=user_id,
            nodes=[node.dict() for node in workflow_data.nodes],
            edges=[edge.dict() for edge in workflow_data.edges]
        )
        self.db.add(db_workflow)
        self.db.commit()
        self.db.refresh(db_workflow)
        return db_workflow

    def get_workflow(self, workflow_id: int, user_id: int) -> Optional[Workflow]:
        """Get workflow by ID for specific user"""
        return self.db.query(Workflow).filter(
            Workflow.id == workflow_id,
            Workflow.user_id == user_id
        ).first()

    def get_user_workflows(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Workflow]:
        """Get all workflows for a user"""
        return self.db.query(Workflow).filter(
            Workflow.user_id == user_id
        ).offset(skip).limit(limit).all()

    def update_workflow(self, workflow_id: int, user_id: int, workflow_data: WorkflowUpdate) -> Optional[Workflow]:
        """Update workflow"""
        workflow = self.get_workflow(workflow_id, user_id)
        if not workflow:
            return None

        update_data = workflow_data.dict(exclude_unset=True)
        
        # Convert nodes and edges to dict format if provided
        if "nodes" in update_data and update_data["nodes"]:
            update_data["nodes"] = [node.dict() for node in update_data["nodes"]]
        if "edges" in update_data and update_data["edges"]:
            update_data["edges"] = [edge.dict() for edge in update_data["edges"]]

        for key, value in update_data.items():
            setattr(workflow, key, value)

        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def delete_workflow(self, workflow_id: int, user_id: int) -> bool:
        """Delete workflow"""
        workflow = self.get_workflow(workflow_id, user_id)
        if not workflow:
            return False

        self.db.delete(workflow)
        self.db.commit()
        return True

    def create_execution(self, workflow_id: int, user_id: int, query: str) -> WorkflowExecution:
        """Create a new workflow execution"""
        execution_id = str(uuid.uuid4())
        db_execution = WorkflowExecution(
            id=execution_id,
            workflow_id=workflow_id,
            user_id=user_id,
            input_query=query,
            status="running"
        )
        self.db.add(db_execution)
        self.db.commit()
        self.db.refresh(db_execution)
        return db_execution

    def update_execution_status(self, execution_id: str, status: str, result: dict = None, error: str = None) -> Optional[WorkflowExecution]:
        """Update execution status"""
        execution = self.db.query(WorkflowExecution).filter(WorkflowExecution.id == execution_id).first()
        if not execution:
            return None

        execution.status = status
        if result:
            execution.result = result
        if error:
            execution.error_message = error
        if status in ["completed", "failed"]:
            execution.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(execution)
        return execution
