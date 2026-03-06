# backend/backend_app/routes/sessions.py
from fastapi import APIRouter, Depends, HTTPException
from backend_app.deps import get_current_user_id
from backend_app.db.session import SessionLocal
from backend_app.db.models_base import Session, Artifact
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter(prefix="/sessions", tags=["Sessions"])

class SessionStart(BaseModel):
    topic: str
    part: int  # 1 atau 2

@router.post("/start")
async def start_session(data: SessionStart, user_id: str = Depends(get_current_user_id)):
    db = SessionLocal()
    try:
        session = Session(
            user_id=user_id,
            part=data.part,
            custom_prompt=data.topic,
            started_at=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"session_id": str(session.id), "message": "Session started"}
    finally:
        db.close()