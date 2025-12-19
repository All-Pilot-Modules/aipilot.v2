from sqlalchemy import Column, String, Integer, ForeignKey, TIMESTAMP, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime, timezone

class FeedbackCritique(Base):
    """
    Student feedback on AI-generated feedback quality.
    Allows students to rate and comment on the AI feedback they receive.
    """
    __tablename__ = "feedback_critiques"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to the AI feedback being critiqued
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("ai_feedback.id", ondelete="CASCADE"), nullable=False)

    # Student who is critiquing (for tracking, not for auth)
    student_id = Column(String, nullable=False)

    # Rating: 1-5 stars or thumbs up/down
    # 1 = Very Poor, 2 = Poor, 3 = Okay, 4 = Good, 5 = Excellent
    # Or simple: 1 = Thumbs Down, 5 = Thumbs Up
    rating = Column(Integer, nullable=False)  # 1-5

    # Student's comment/critique
    comment = Column(Text, nullable=True)  # Optional detailed feedback

    # Categorized issues (optional - for analytics)
    # Examples: "not_helpful", "incorrect", "too_vague", "too_harsh", "helpful"
    feedback_type = Column(String(50), nullable=True)

    # Timestamp
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('ix_feedback_critiques_feedback_id', 'feedback_id'),
        Index('ix_feedback_critiques_student_id', 'student_id'),
        Index('ix_feedback_critiques_rating', 'rating'),
        Index('ix_feedback_critiques_created_at', 'created_at'),
    )
