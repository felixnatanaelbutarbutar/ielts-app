# backend_app/routes/asr.py
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from faster_whisper import WhisperModel
from backend_app.db.models_base import Artifact, Question, User  # HAPUS DBSession
from backend_app.db.base import get_db
from sqlalchemy.orm import Session  # PAKAI INI UNTUK DB
from sqlalchemy import func
import os, tempfile, uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/asr", tags=["asr"])

# MODEL WHISPER
model = WhisperModel("base", device="cpu", compute_type="float32")

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    topic: str = Form(...),
    user_id: str = Form(...),  # EMAIL
    part: str = Form("2"),
    question_id: str = Form(None),
    vad: str = Form("true"),               # baru: "true" atau "false"
    db: Session = Depends(get_db)
):
    # basic validation
    if not file.filename.lower().endswith(('.webm', '.mp3', '.wav')):
        raise HTTPException(status_code=400, detail="Format audio tidak didukung")

    suffix = os.path.splitext(file.filename)[1]
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = temp_file.name

    try:
        content = await file.read()
        # quick check: file not empty
        if not content or len(content) == 0:
            raise HTTPException(status_code=400, detail="Audio file kosong")

        temp_file.write(content)
        temp_file.close()

        logger.info(f"Transcribing: {temp_path} (size={len(content)} bytes)")

        # decide vad_filter from form param (default true)
        vad_flag = False
        if isinstance(vad, str) and vad.lower() in ("0", "false", "no"):
            vad_flag = False

        # TRANSCRIBE
        segments, info = model.transcribe(
            temp_path,
            language="en",
            beam_size=5,
            vad_filter=vad_flag
        )

        # logging details for debugging
        seg_texts = [getattr(s, "text", "") for s in segments] if segments else []
        logger.info(f"Got segments count={len(seg_texts)}; sample='{(' '.join(seg_texts)[:200])}'")
        logger.info(f"Transcribe info: {getattr(info, '__dict__', info)}")

        full_text = " ".join(t for t in seg_texts).strip()

        # if empty transcript -> return 400 with clear detail (do NOT swallow)
        if not full_text:
            # helpful log for why (VAD removed everything?)
            logger.warning("Empty transcript produced. VAD=%s, duration=%s", vad_flag, getattr(info, "duration", None))
            # cleanup temp
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception:
                logger.exception("Failed to remove temp file")
            raise HTTPException(status_code=400, detail="Transkrip kosong — bicara lebih jelas atau coba matikan VAD (vad=false) untuk debugging")

        logger.info(f"Transkrip: {full_text[:200]}...")

        # find user
        user = db.query(User).filter(User.email == user_id).first()
        if not user:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except:
                pass
            raise HTTPException(status_code=404, detail="User tidak ditemukan")

        # optional: find question
        question = db.query(Question).filter(Question.id == question_id).first() if question_id else None

        # build json_data
        json_data = {"part1": [], "part2": []}
        if part == "1":
            json_data["part1"].append({
                "id": str(question.id) if question else None,
                "question": question.prompt if question else None,
                "answer": full_text
            })
        else:
            json_data["part2"].append({
                "id": str(question.id) if question else None,
                "cue_card": question.cue_card if question else None,
                "bullets": question.bullets or [],
                "answer": full_text
            })

        # compute wpm safely
        duration = getattr(info, "duration", None) or 0
        if duration and duration > 0:
            duration_minutes = duration / 60
        else:
            # fallback: assume 1 minute to avoid div0
            duration_minutes = max(1/60, len(full_text.split())/160)
        wpm = round(len(full_text.split()) / duration_minutes, 1)

        # persist artifact
        artifact = Artifact(
            id=uuid.uuid4(),
            user_id=user.id,
            json_data=json_data,
            fluency_json={"wpm": wpm, "vad_used": vad_flag},
            created_at=func.now()
        )
        db.add(artifact)
        db.commit()
        db.refresh(artifact)

        logger.info(f"Artifact saved: {artifact.id}")

        # cleanup
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except Exception:
            logger.exception("Failed to remove temp file")

        return {"status": "success", "artifact_id": str(artifact.id), "text": full_text}

    except HTTPException:
        # re-raise fastapi errors so they return correct status
        raise
    except Exception as e:
        logger.error(f"ERROR: {str(e)}", exc_info=True)
        # cleanup
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except Exception:
            logger.exception("Failed to remove temp file after error")
        raise HTTPException(status_code=500, detail=f"Transkripsi gagal: {str(e)}")

@router.get("/artifacts")
def get_history(db: Session = Depends(get_db)):
    artifacts = db.query(Artifact).order_by(Artifact.created_at.desc()).limit(20).all()
    return [
        {
            "id": str(a.id),
            "json_data": a.json_data,
            "wpm": a.fluency_json.get("wpm", 0),
            "created_at": a.created_at.strftime("%H:%M %d/%m")
        }
        for a in artifacts
    ]