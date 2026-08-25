from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from ...services.assistant_service import AssistantService
from ...core.security import get_role_context, RoleContext, log_audit_event

router = APIRouter(prefix="/assistant", tags=["AI City Assistant"])

@router.post("/query", response_model=AssistantQueryResponse, summary="Submit natural-language query to AI City Assistant")
def assistant_query(
    payload: AssistantQueryRequest,
    db: Session = Depends(get_db),
    role_ctx: RoleContext = Depends(get_role_context)
):
    """
    FR-15.1 & FR-15.2: Natural language question translated to safe whitelisted queries.
    FR-15.3: Query logged to assistant_query_logs.
    FR-15.4: Response returns natural text + structured chart data.
    """
    if not payload.query.strip():
        raise HTTPException(status_code=422, detail="Query cannot be empty")
        
    log_audit_event(
        db,
        actor_role=role_ctx.role,
        action="ai_assistant_query",
        target_type="assistant"
    )

    return AssistantService.process_nl_query(db, payload.query)
