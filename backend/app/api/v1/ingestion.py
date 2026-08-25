from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.event import IngestionEventCreate, VehicleEventOut
from ...services.ingestion_service import IngestionService

router = APIRouter(prefix="/ingestion", tags=["Event Ingestion"])

@router.post("/event", response_model=VehicleEventOut, status_code=status.HTTP_201_CREATED, summary="Ingest live ANPR vehicle detection event")
async def ingest_event(payload: IngestionEventCreate, db: Session = Depends(get_db)):
    """
    FR-05.1: POST /api/v1/ingestion/event accepts validated event payload.
    FR-05.2: Fuzzy plate match against existing vehicles.
    FR-05.3: Persists with PostGIS coordinates.
    FR-05.4: Broadcasts to live event bus / WebSocket feed.
    """
    if not payload.plate_text:
        raise HTTPException(status_code=422, detail="plate_text cannot be empty")
    
    event = await IngestionService.process_ingestion_event(db, payload.model_dump())
    return event
