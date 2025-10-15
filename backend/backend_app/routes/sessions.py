from fastapi import APIRouter, Depends
from backend_app.deps import get_current_user_id

router = APIRouter(prefix="/api", tags=["sessions"])

@router.post("/sessions")
def create_session(body: dict, user_id: str = Depends(get_current_user_id)):
    return {
        "ok": True,
        "message": "Session created successfully",
        "user_id": user_id,
        "body": body,
    }
