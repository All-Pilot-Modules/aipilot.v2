from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, TIMESTAMP, Index, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base
import uuid
from datetime import datetime, timezone

class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to student answer (single source of truth)
    answer_id = Column(UUID(as_uuid=True), ForeignKey("student_answers.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Correctness (nullable to allow feedback without correct answer)
    is_correct = Column(Boolean, nullable=True)  # None when correct answer not set
    score = Column(Integer, nullable=True)  # 0-100, None when correct answer not set

    # Points tracking (for point-based grading)
    points_earned = Column(Float, nullable=True)     # Actual points earned (e.g., 7.5 out of 10)
    points_possible = Column(Float, nullable=True)   # Max points for this question

    # Rubric-based scoring
    criterion_scores = Column(JSONB, nullable=True)  # Per-criterion breakdown
    # Format: {"accuracy": {"score": 34, "out_of": 40, "reasoning": "..."}, ...}

    confidence_level = Column(String(20), nullable=True)  # "high", "medium", "low"

    # Feedback content (stored as JSONB for flexibility)
    feedback_data = Column(JSONB, nullable=False)  # Contains explanation, hints, strengths, weaknesses, etc.

    # Timestamp
    generated_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('ix_ai_feedback_answer_id', 'answer_id'),
        Index('ix_ai_feedback_generated_at', 'generated_at'),
    )
