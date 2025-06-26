from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.execution_service import execution_engine

router = APIRouter(prefix="/ws", tags=["websockets"])


@router.websocket("/execution/{execution_id}")
async def websocket_execution_progress(websocket: WebSocket, execution_id: str):
    """WebSocket endpoint for real-time execution progress"""
    await execution_engine.websocket_manager.connect(websocket, execution_id)
    
    try:
        # Keep connection alive and handle disconnection
        while True:
            try:
                # Wait for any message (client can send ping to keep alive)
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        execution_engine.websocket_manager.disconnect(websocket, execution_id)
