from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ...core.database import get_db
from ...models.audit import AuditLog
from ...core.security import get_role_context, RoleContext

router = APIRouter(prefix="/governance", tags=["Governance & Privacy"])

@router.get("/audit-logs", summary="List security audit logs for compliance tracking")
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """FR-16.3: Audit log of every raw-plate lookup and blacklist mutation."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "actor_role": log.actor_role,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]
