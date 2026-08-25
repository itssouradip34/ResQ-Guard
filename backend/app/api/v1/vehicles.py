from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.vehicle import Vehicle
from ...schemas.vehicle import VehicleOut, BlacklistToggle
from ...core.security import get_role_context, RoleContext, mask_plate, log_audit_event

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleOut], summary="List vehicles with role-based plate privacy masking")
def list_vehicles(
    is_blacklisted: Optional[bool] = None,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    query = db.query(Vehicle)
    if is_blacklisted is not None:
        query = query.filter(Vehicle.is_blacklisted == is_blacklisted)
    
    vehicles = query.order_by(Vehicle.last_seen.desc()).limit(100).all()
    
    # Audit log if authority views raw plates
    log_audit_event(
        db,
        actor_role=role_ctx.role,
        action="list_vehicles",
        target_type="vehicle"
    )

    results = []
    for v in vehicles:
        plate = v.plate_number if role_ctx.is_authority else mask_plate(v.plate_number)
        results.append(VehicleOut(
            id=v.id,
            plate_number=plate,
            plate_hash=v.plate_hash,
            vehicle_type=v.vehicle_type,
            color=v.color,
            is_blacklisted=v.is_blacklisted,
            blacklist_reason=v.blacklist_reason,
            needs_review=v.needs_review,
            dna_embedding=v.dna_embedding,
            first_seen=v.first_seen,
            last_seen=v.last_seen
        ))
    return results

@router.get("/{vehicle_id}", response_model=VehicleOut, summary="Get vehicle details by ID")
def get_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    log_audit_event(
        db,
        actor_role=role_ctx.role,
        action="view_vehicle_details",
        target_type="vehicle",
        target_id=v.id
    )

    plate = v.plate_number if role_ctx.is_authority else mask_plate(v.plate_number)
    return VehicleOut(
        id=v.id,
        plate_number=plate,
        plate_hash=v.plate_hash,
        vehicle_type=v.vehicle_type,
        color=v.color,
        is_blacklisted=v.is_blacklisted,
        blacklist_reason=v.blacklist_reason,
        needs_review=v.needs_review,
        dna_embedding=v.dna_embedding,
        first_seen=v.first_seen,
        last_seen=v.last_seen
    )

@router.post("/{vehicle_id}/blacklist", response_model=VehicleOut, summary="Toggle vehicle blacklist status")
def toggle_blacklist(
    vehicle_id: str,
    toggle_in: BlacklistToggle,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-09.1: POST /api/v1/vehicles/{id}/blacklist adds/removes vehicle from blacklist."""
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    v.is_blacklisted = toggle_in.is_blacklisted
    if toggle_in.is_blacklisted:
        v.blacklist_reason = toggle_in.reason or "Marked by Operator"
    else:
        v.blacklist_reason = None
    
    db.add(v)
    db.commit()
    db.refresh(v)

    # Log to security audit trail
    log_audit_event(
        db,
        actor_role=role_ctx.role,
        action="toggle_blacklist",
        target_type="vehicle",
        target_id=v.id
    )

    plate = v.plate_number if role_ctx.is_authority else mask_plate(v.plate_number)
    return VehicleOut(
        id=v.id,
        plate_number=plate,
        plate_hash=v.plate_hash,
        vehicle_type=v.vehicle_type,
        color=v.color,
        is_blacklisted=v.is_blacklisted,
        blacklist_reason=v.blacklist_reason,
        needs_review=v.needs_review,
        dna_embedding=v.dna_embedding,
        first_seen=v.first_seen,
        last_seen=v.last_seen
    )
