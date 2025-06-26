from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json


class WebSocketManager:
    def __init__(self):
        # execution_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        """Connect websocket for execution tracking"""
        await websocket.accept()
        
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        
        self.active_connections[execution_id].append(websocket)

    def disconnect(self, websocket: WebSocket, execution_id: str):
        """Disconnect websocket"""
        if execution_id in self.active_connections:
            if websocket in self.active_connections[execution_id]:
                self.active_connections[execution_id].remove(websocket)
            
            # Clean up empty connections
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

    async def send_to_execution(self, execution_id: str, message: dict):
        """Send message to all websockets for an execution"""
        if execution_id in self.active_connections:
            # Create a copy of the list to avoid modification during iteration
            connections = self.active_connections[execution_id].copy()
            
            for websocket in connections:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception:
                    # Remove failed connections
                    self.disconnect(websocket, execution_id)

    async def broadcast(self, message: dict):
        """Broadcast message to all active connections"""
        for execution_id in list(self.active_connections.keys()):
            await self.send_to_execution(execution_id, message)

    def get_connection_count(self, execution_id: str = None) -> int:
        """Get number of active connections"""
        if execution_id:
            return len(self.active_connections.get(execution_id, []))
        
        return sum(len(connections) for connections in self.active_connections.values())
