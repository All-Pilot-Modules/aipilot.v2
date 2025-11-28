from sqlalchemy import Column, String, Integer, ForeignKey, TIMESTAMP, Index, UniqueConstraint, Float
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class TestSubmission(Base):
    """
    Track test submissions separately from answers.
    This allows us to distinguish between draft saves and final submissions.
    """
    __tablename__ = "test_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Student and module identification
    student_id = Column(String, nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)

    # Attempt tracking (1, 2, etc.)
    attempt = Column(Integer, nullable=False)

    # Submission metadata
    submitted_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    questions_count = Column(Integer, nullable=False)  # How many questions were submitted

    # Score tracking
    total_points_possible = Column(Float, nullable=True)  # Total points available in test
    total_points_earned = Column(Float, nullable=True)    # Total points student earned
    percentage_score = Column(Float, nullable=True)       # Percentage (0-100)

    # Ensure one submission per student per module per attempt
    __table_args__ = (
        UniqueConstraint('student_id', 'module_id', 'attempt', name='uq_test_submission'),
        Index('ix_test_submission_lookup', 'student_id', 'module_id'),
    )
