# backend_app/routes/topics.py
from fastapi import APIRouter, Depends, HTTPException
from backend_app.db.base import get_db
from backend_app.db.models_base import Topic, Question
from sqlalchemy.orm import Session

router = APIRouter(prefix="/topics", tags=["topics"])

# GET SEMUA TOPIK (SUDAH ADA)
@router.get("/")
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).filter(Topic.active == True).all()
    return [
        {"id": str(t.id), "name": t.name, "slug": t.slug, "icon": t.icon}
        for t in topics
    ]

# INI YANG HILANG — TAMBAHKAN!
@router.get("/{slug}/questions")
def get_questions_by_slug(slug: str, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.slug == slug, Topic.active == True).first()
    if not topic:
        raise HTTPException(404, detail="Topic not found")

    # Part 1 questions
    part1_questions = [
        q for q in topic.questions
        if q.part == 1 and q.active and q.prompt
    ]

    # Part 2 cue card (ambil yang pertama aktif)
    part2_question = next(
        (q for q in topic.questions if q.part == 2 and q.active),
        None
    )

    return {
        "topic": topic.name,
        "part1": [
            {"id": str(q.id), "question": q.prompt}
            for q in part1_questions[:4]  # hanya 4 soal Part 1
        ],
        "part2": {
            "id": str(part2_question.id) if part2_question else "",
            "cue_card": part2_question.cue_card or "",
            "bullets": part2_question.bullets or []
        } if part2_question else None
    }