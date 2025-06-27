"""Add workflow_id to documents table

Revision ID: 002_add_workflow_id_to_documents
Revises: f96f1d1ecf59
Create Date: 2025-06-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_workflow_id_to_documents'
down_revision = 'f96f1d1ecf59'
branch_labels = None
depends_on = None


def upgrade():
    # Add workflow_id column to documents table
    op.add_column('documents', sa.Column('workflow_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_documents_workflow_id', 
        'documents', 
        'workflows', 
        ['workflow_id'], 
        ['id']
    )


def downgrade():
    # Drop foreign key constraint
    op.drop_constraint('fk_documents_workflow_id', 'documents', type_='foreignkey')
    
    # Drop workflow_id column
    op.drop_column('documents', 'workflow_id')
