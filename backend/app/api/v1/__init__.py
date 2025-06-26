from fastapi import APIRouter
from app.api.v1 import auth, workflows, documents, websocket, search

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(workflows.router)
api_router.include_router(documents.router)
api_router.include_router(websocket.router)
api_router.include_router(search.router)
