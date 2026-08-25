import hashlib
import re
from datetime import datetime
from typing import Optional
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from .database import get_db

def hash_plate(plate_number: str) -> str:
    """Computes a one-way SHA-256 hash for privacy-preserving analytics."""
    if not plate_number:
        return ""
    normalized = re.sub(r'[^A-Z0-9]', '', plate_number.upper())
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def mask_plate(plate_number: str) -> str:
    """
    Masks license plate for analyst/public roles.
    Example: 'DL01AB1234' -> 'DL01 XX ****' or 'MP04 XX ****'
    """
    if not plate_number:
        return "UNKNOWN"
    norm = re.sub(r'[^A-Z0-9]', '', plate_number.upper())
    if len(norm) >= 8:
        state_code = norm[:4]
        return f"{state_code} XX ****"
    elif len(norm) >= 4:
        return f"{norm[:2]}** ****"
    return "****"

class RoleContext:
    def __init__(self, role: str = "authority"):
        # Roles: 'authority' (full access) or 'analyst' (masked plates)
        self.role = role.lower() if role else "authority"

    @property
    def is_authority(self) -> bool:
        return self.role == "authority"

def get_role_context(x_user_role: Optional[str] = Header("authority", alias="X-User-Role")) -> RoleContext:
    return RoleContext(role=x_user_role or "authority")

def log_audit_event(
    db: Session,
    actor_role: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    details: Optional[dict] = None
):
    from ..models.audit import AuditLog
    audit_entry = AuditLog(
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        created_at=datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()
