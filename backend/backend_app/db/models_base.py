# app/db/models_base.py
import uuid
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, SmallInteger,
    ForeignKey, JSON, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .base import Base


# =========================
# USERS TABLE
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    password_hash = Column(String)
    provider = Column(String)
    provider_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# =========================
# QUESTIONS TABLE
# =========================
class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part = Column(SmallInteger, nullable=False)  # 1 atau 2
    topic = Column(Text)
    prompt = Column(Text, nullable=False)
    active = Column(Boolean, server_default="true", default=True)

    __table_args__ = (
        CheckConstraint("part in (1,2)", name="chk_questions_part"),
        Index("idx_questions_part_active", "part", "active"),
    )


# =========================
# SESSIONS TABLE
# =========================
class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    part = Column(SmallInteger, nullable=False)  # 1 atau 2
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=True)
    custom_prompt = Column(Text)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint("part in (1,2)", name="chk_sessions_part"),
        Index("idx_sessions_user_time", "user_id", "started_at"),
    )


# =========================
# ARTIFACTS TABLE
# =========================
class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)

    # hasil model AI
    audio_url = Column(Text)
    transcript = Column(Text)
    fluency_json = Column(JSON)
    grammar_output = Column(Text)
    coherence_json = Column(JSON)
    vocab_json = Column(JSON)
    band_scores_json = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_artifacts_session", "session_id"),
    )
