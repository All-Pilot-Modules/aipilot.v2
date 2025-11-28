from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class AIFeedbackCreate(BaseModel):
    """Schema for creating AI feedback"""
    answer_id: UUID
    is_correct: Optional[bool]  # None when correct answer not set
    score: Optional[int] = Field(None, ge=0, le=100)  # None when correct answer not set
    feedback_data: Dict[str, Any]  # Contains all feedback details
    points_earned: Optional[float] = None  # Points earned for this question
    points_possible: Optional[float] = None  # Maximum points for this question
    criterion_scores: Optional[Dict[str, Any]] = None  # Rubric-based scoring breakdown
    confidence_level: Optional[str] = None  # Confidence level: high, medium, low

class AIFeedbackResponse(BaseModel):
    """Schema for returning AI feedback"""
    id: UUID
    answer_id: UUID
    is_correct: Optional[bool]  # None when correct answer not set
    score: Optional[int]  # None when correct answer not set
    feedback_data: Dict[str, Any]
    generated_at: datetime

    class Config:
        from_attributes = True
