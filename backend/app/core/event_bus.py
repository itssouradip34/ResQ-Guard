import asyncio
import json
from typing import List, Set
from fastapi import WebSocket

class EventBus:
    def __init__(self):
        self.live_feed_subscribers: Set[WebSocket] = set()
        self.alerts_subscribers: Set[WebSocket] = set()
        self.cameras_subscribers: Set[WebSocket] = set()

    async def connect_live_feed(self, websocket: WebSocket):
        await websocket.accept()
        self.live_feed_subscribers.add(websocket)

    def disconnect_live_feed(self, websocket: WebSocket):
        self.live_feed_subscribers.discard(websocket)

    async def connect_alerts(self, websocket: WebSocket):
        await websocket.accept()
        self.alerts_subscribers.add(websocket)

    def disconnect_alerts(self, websocket: WebSocket):
        self.alerts_subscribers.discard(websocket)

    async def connect_cameras(self, websocket: WebSocket):
        await websocket.accept()
        self.cameras_subscribers.add(websocket)

    def disconnect_cameras(self, websocket: WebSocket):
        self.cameras_subscribers.discard(websocket)

    async def broadcast_vehicle_event(self, data: dict):
        if not self.live_feed_subscribers:
            return
        msg = json.dumps({"type": "vehicle_event", "data": data})
        dead = []
        for ws in self.live_feed_subscribers:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.live_feed_subscribers.discard(ws)

    async def broadcast_alert(self, data: dict):
        if not self.alerts_subscribers:
            return
        msg = json.dumps({"type": "alert", "data": data})
        dead = []
        for ws in self.alerts_subscribers:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.alerts_subscribers.discard(ws)

    async def broadcast_camera_status(self, data: dict):
        if not self.cameras_subscribers:
            return
        msg = json.dumps({"type": "camera_status", "data": data})
        dead = []
        for ws in self.cameras_subscribers:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.cameras_subscribers.discard(ws)

event_bus = EventBus()
