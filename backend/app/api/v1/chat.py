from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse,
    ChatMessageCreate, ChatMessageResponse
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
    return [ChatSessionResponse(
        id=str(s.id),
        user_id=str(s.user_id),
        workflow_id=str(s.workflow_id) if s.workflow_id else None,
        title=s.title,
        created_at=s.created_at,
        messages=[ChatMessageResponse(
            id=str(m.id),
            session_id=str(m.session_id),
            content=m.content,
            role=m.role,
            timestamp=m.timestamp
        ) for m in s.messages]
    ) for s in sessions]

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(session: ChatSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_session = ChatSession(
        user_id=current_user.id,
        workflow_id=session.workflow_id,
        title=session.title,
        created_at=datetime.utcnow()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return ChatSessionResponse(
        id=str(db_session.id),
        user_id=str(db_session.user_id),
        workflow_id=str(db_session.workflow_id) if db_session.workflow_id else None,
        title=db_session.title,
        created_at=db_session.created_at,
        messages=[]
    )

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return [ChatMessageResponse(
        id=str(m.id),
        session_id=str(m.session_id),
        content=m.content,
        role=m.role,
        timestamp=m.timestamp
    ) for m in session.messages]

@router.post("/messages", response_model=ChatMessageResponse)
async def create_message(message: ChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == message.session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db_message = ChatMessage(
        session_id=message.session_id,
        content=message.content,
        role=message.role,
        timestamp=datetime.utcnow()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return ChatMessageResponse(
        id=str(db_message.id),
        session_id=str(db_message.session_id),
        content=db_message.content,
        role=db_message.role,
        timestamp=db_message.timestamp
    )
