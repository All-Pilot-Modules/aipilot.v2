from sqlalchemy import Column, String, Boolean, ForeignKey, TIMESTAMP, Index, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base
import uuid

class TeacherGrade(Base):
    """
    Manual grades assigned by teachers (typically for final attempts).
    Takes precedence over AI-generated grades.
    """
    __tablename__ = "teacher_grades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to student answer
    answer_id = Column(UUID(as_uuid=True), ForeignKey("student_answers.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Student and question identification (for easier querying)
    student_id = Column(String, nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)

    # Teacher's grade
    points_awarded = Column(Float, nullable=False)
    feedback_text = Column(Text, nullable=True)  # Teacher's written feedback
    criterion_scores = Column(JSONB, nullable=True)  # Optional: per-criterion breakdown

    # AI comparison (for analytics)
    ai_suggested_score = Column(Float, nullable=True)  # What AI suggested
    overridden_ai = Column(Boolean, default=False)  # True if different from AI

    # Teacher identification and timestamp
    graded_by = Column(String, ForeignKey("users.id"), nullable=False)  # VARCHAR to match users.id type
    graded_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index('ix_teacher_grades_answer_id', 'answer_id'),
        Index('ix_teacher_grades_student_module', 'student_id', 'module_id'),
        Index('ix_teacher_grades_graded_by', 'graded_by'),
    )
