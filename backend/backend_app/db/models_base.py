# backend_app/db/models_base.py
import uuid
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, SmallInteger,
    ForeignKey, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .base import Base
from sqlalchemy.orm import relationship

# =========================
# USER
# =========================
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String)
    password_hash = Column(String)
    provider = Column(String)
    provider_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # langsung ke artifacts (Session dihapus)
    artifacts = relationship("Artifact", back_populates="user", cascade="all, delete-orphan")


# =========================
# TOPIC
# =========================
class Topic(Base):
    __tablename__ = "topics"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    icon = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    questions = relationship("Question", back_populates="topic", cascade="all, delete-orphan")


# =========================
# QUESTION (Part 1 & Part 2)
# =========================
class Question(Base):
    __tablename__ = "questions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    part = Column(SmallInteger, nullable=False)  # 1 = Part 1, 2 = Part 2
    cue_card = Column(String, nullable=True)     # Part 2
    bullets = Column(JSON, nullable=True)        # Part 2
    prompt = Column(String, nullable=True)       # Part 1
    active = Column(Boolean, default=True)

    topic = relationship("Topic", back_populates="questions")
    # tidak ada relationship ke sessions / artifacts di DB (hybrid approach)


# =========================
# ARTIFACT — menyimpan jawaban & referensi question.id di dalam json_data
# =========================
class Artifact(Base):
    __tablename__ = "artifacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # relasi langsung ke user (required)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="artifacts")

    # json_data: simpan struktur yang mengandung question IDs (referensi aplikasi-level)
    # contoh: { "session_metadata": {...}, "part1": [{ "id": "<question-uuid>", "question": "...", "answer": "..." }], "part2": [...] }
    json_data = Column(JSON, nullable=False)

    # opsional: analisis terpisah (boleh dihapus jika ingin semua di json_data)
    fluency_json = Column(JSON, nullable=True)
    grammar_output = Column(Text, nullable=True)
    coherence_json = Column(JSON, nullable=True)
    vocab_json = Column(JSON, nullable=True)
    band_scores_json = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("idx_artifacts_user", "user_id"),)
