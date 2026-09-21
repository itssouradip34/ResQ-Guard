from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from ...core.database import get_db
from ...services.node_forwarding_service import NodeForwardingService
from ...models.node_handoff import VehicleToken, NodeHandoffPacket

router = APIRouter(prefix="/node-forwarding", tags=["Node Forwarding Protocol"])

class TokenHandoffRequest(BaseModel):
    plate_number: str
    camera_id: str
    lat: float
    lng: float
    vehicle_type: str = "car"
    color: str = "White"
    speed_kmh: float = 45.0

@router.get("/metrics", summary="Get edge forwarding bandwidth compression and token metrics")
def get_forwarding_metrics(db: Session = Depends(get_db)):
    """Feature 1: Returns single-address vehicle token compression and bandwidth savings."""
    return NodeForwardingService.get_token_metrics(db)

@router.get("/tokens", summary="List active single-address vehicle tokens")
def list_vehicle_tokens(
    camera_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(VehicleToken)
    if camera_id:
        query = query.filter(VehicleToken.current_camera_id == camera_id)
    if is_active is not None:
        query = query.filter(VehicleToken.is_active == is_active)
    
    tokens = query.order_by(VehicleToken.last_updated.desc()).offset(offset).limit(limit).all()
    return [
        {
            "token_id": t.token_id,
            "plate_number": t.plate_number,
            "vehicle_type": t.vehicle_type,
            "color": t.color,
            "current_camera_id": t.current_camera_id,
            "current_lat": t.current_lat,
            "current_lng": t.current_lng,
            "speed_kmh": t.speed_kmh,
            "heading_deg": t.heading_deg,
            "trajectory_vector": t.trajectory_vector,
            "predicted_next_nodes": t.predicted_next_nodes,
            "is_active": t.is_active,
            "last_updated": t.last_updated.isoformat()
        }
        for t in tokens
    ]

@router.get("/packets", summary="List transmitted edge-to-edge handoff packets")
def list_handoff_packets(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    packets = db.query(NodeHandoffPacket).order_by(NodeHandoffPacket.created_at.desc()).limit(limit).all()
    return [
        {
            "id": p.id,
            "token_id": p.token_id,
            "source_camera_id": p.source_camera_id,
            "target_camera_id": p.target_camera_id,
            "estimated_arrival_time": p.estimated_arrival_time.isoformat(),
            "transit_confidence": p.transit_confidence,
            "payload_size_bytes": p.payload_size_bytes,
            "acknowledged": p.acknowledged,
            "created_at": p.created_at.isoformat()
        }
        for p in packets
    ]

@router.post("/handoff", summary="Trigger vehicle token creation and edge node handoff")
def trigger_node_handoff(
    payload: TokenHandoffRequest,
    db: Session = Depends(get_db)
):
    token = NodeForwardingService.get_or_create_token(
        db=db,
        plate_number=payload.plate_number,
        camera_id=payload.camera_id,
        lat=payload.lat,
        lng=payload.lng,
        vehicle_type=payload.vehicle_type,
        color=payload.color,
        speed_kmh=payload.speed_kmh
    )
    dispatched_packets = NodeForwardingService.forward_state_to_next_nodes(db, token)
    return {
        "token_id": token.token_id,
        "plate_number": token.plate_number,
        "heading_deg": token.heading_deg,
        "predicted_next_nodes": token.predicted_next_nodes,
        "dispatched_handoff_packets": dispatched_packets
    }
