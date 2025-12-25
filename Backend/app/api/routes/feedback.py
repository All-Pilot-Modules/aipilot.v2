from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import logging

from app.database import get_db
from app.models.ai_feedback import AIFeedback
from app.models.student_answer import StudentAnswer

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{feedback_id}")
def get_ai_feedback_by_id(
    feedback_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get AI feedback by ID.
    Returns the feedback details including feedback text, score, question_id, and metadata.
    Used by the feedback critiques page to display feedback details.
    """
    feedback = db.query(AIFeedback).filter(AIFeedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Get the associated answer to include question_id
    answer = db.query(StudentAnswer).filter(StudentAnswer.id == feedback.answer_id).first()

    if not answer:
        raise HTTPException(status_code=404, detail="Associated answer not found")

    # Build response with all necessary fields
    data = feedback.feedback_data or {}

    return {
        "id": str(feedback.id),
        "answer_id": str(feedback.answer_id),
        "question_id": str(answer.question_id),
        "feedback_text": data.get("explanation", "") or data.get("feedback", ""),
        "is_correct": feedback.is_correct,
        "score": feedback.score,
        "correctness_score": feedback.score,
        "points_earned": feedback.points_earned,
        "points_possible": feedback.points_possible,
        "criterion_scores": feedback.criterion_scores,
        "explanation": data.get("explanation", ""),
        "improvement_hint": data.get("improvement_hint"),
        "concept_explanation": data.get("concept_explanation"),
        "strengths": data.get("strengths"),
        "weaknesses": data.get("weaknesses"),
        "selected_option": data.get("selected_option"),
        "correct_option": data.get("correct_option"),
        "available_options": data.get("available_options"),
        "grading_details": data.get("grading_details"),
        "selected_options": data.get("selected_options"),
        "sub_results": data.get("sub_results"),
        "has_course_materials": data.get("used_rag", False),
        "generated_at": feedback.generated_at.isoformat() if feedback.generated_at else None
    }
