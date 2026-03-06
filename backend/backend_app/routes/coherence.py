# backend/backend_app/routes/coherence.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend_app.services.coherence_service import predict_coherence
from backend_app.deps import get_current_user_id

router = APIRouter(prefix="/coherence", tags=["Coherence"])

class CoherenceRequest(BaseModel):
    prompt: str
    answer: str

@router.post("/score")
async def score_coherence(
    req: CoherenceRequest,
    user_id: str = Depends(get_current_user_id)
):
    result = predict_coherence(req.prompt, req.answer)
    return {"user_id": user_id, **result}