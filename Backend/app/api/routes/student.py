from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
import logging

from app.schemas.student_answer import StudentAnswerCreate, StudentAnswerOut, StudentAnswerUpdate
from app.schemas.module import ModuleOut
from app.schemas.document import DocumentOut
from app.schemas.question import QuestionOut
from app.schemas.ai_feedback import AIFeedbackResponse
from app.crud.student_answer import (
    create_student_answer,
    get_student_answer,
    get_student_answers_by_document,
    update_student_answer,
    delete_student_answer,
    get_student_progress,
    has_completed_attempt
)
from app.crud.module import get_module_by_access_code, get_module_by_id
from app.models.module import Module
from app.crud.document import get_documents_by_module, get_documents_by_module_for_students
from app.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


# 🎯 Background task to generate feedback asynchronously with PARALLEL processing
def generate_feedback_background(student_id: str, module_id: str, attempt: int, answer_ids: List[str]):
    """
    Background task to generate AI feedback for multiple answers IN PARALLEL.
    This runs asynchronously and generates feedback for all questions concurrently
    to significantly reduce total generation time.
    """
    import concurrent.futures
    import time
    from app.database import SessionLocal
    from app.services.ai_feedback import AIFeedbackService
    from app.models.student_answer import StudentAnswer

    def generate_single_feedback(answer_id: str):
        """Generate feedback for a single answer (runs in thread pool)"""
        # Each thread gets its own database session
        db = SessionLocal()
        try:
            # Get the answer
            answer = db.query(StudentAnswer).filter(StudentAnswer.id == answer_id).first()
            if not answer:
                logger.error(f"❌ Answer {answer_id} not found")
                return {"success": False, "answer_id": answer_id, "error": "Answer not found"}

            logger.info(f"🔄 Generating feedback for question {answer.question_id}, answer {answer_id}")

            # Generate feedback
            feedback_service = AIFeedbackService()
            feedback = feedback_service.generate_instant_feedback(
                db=db,
                student_answer=answer,
                question_id=str(answer.question_id),
                module_id=module_id
            )

            logger.info(f"✅ Feedback generated for question {answer.question_id}")
            return {"success": True, "answer_id": answer_id, "question_id": str(answer.question_id)}

        except Exception as e:
            logger.error(f"❌ Failed to generate feedback for answer {answer_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "answer_id": answer_id, "error": str(e)}
        finally:
            db.close()

    try:
        logger.info(f"🎯 Starting PARALLEL background feedback generation for {len(answer_ids)} answers")
        start_time = time.time()

        # Use ThreadPoolExecutor to generate feedback in parallel
        # Max workers = min(10, number of questions) to avoid overwhelming the API
        max_workers = min(10, len(answer_ids))
        logger.info(f"🚀 Using {max_workers} parallel threads for feedback generation")

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all feedback generation tasks
            future_to_answer = {
                executor.submit(generate_single_feedback, answer_id): answer_id
                for answer_id in answer_ids
            }

            # Wait for all tasks to complete
            completed = 0
            failed = 0
            for future in concurrent.futures.as_completed(future_to_answer):
                answer_id = future_to_answer[future]
                try:
                    result = future.result()
                    if result["success"]:
                        completed += 1
                        logger.info(f"✅ [{completed}/{len(answer_ids)}] Feedback completed for {result['question_id']}")
                    else:
                        failed += 1
                        logger.error(f"❌ [{completed + failed}/{len(answer_ids)}] Feedback failed for {answer_id}")
                except Exception as exc:
                    failed += 1
                    logger.error(f"❌ Task generated exception for {answer_id}: {exc}")

        elapsed_time = time.time() - start_time
        logger.info(f"✅ PARALLEL feedback generation completed for attempt {attempt}")
        logger.info(f"📊 Results: {completed} succeeded, {failed} failed out of {len(answer_ids)} total")
        logger.info(f"⏱️  Total time: {elapsed_time:.2f} seconds ({elapsed_time/len(answer_ids):.2f}s per question average)")

        # Calculate total score for this test submission
        logger.info(f"🔢 Calculating total score for attempt {attempt}")
        db = SessionLocal()
        try:
            from app.models.ai_feedback import AIFeedback
            from app.models.question import Question
            from app.models.test_submission import TestSubmission
            from uuid import UUID

            # Get all answers for this attempt to get their questions
            answers = db.query(StudentAnswer).filter(
                StudentAnswer.student_id == student_id,
                StudentAnswer.module_id == UUID(module_id),
                StudentAnswer.attempt == attempt
            ).all()

            total_points_possible = 0.0
            total_points_earned = 0.0

            for answer in answers:
                # Get the question to know points possible
                question = db.query(Question).filter(Question.id == answer.question_id).first()
                if question:
                    total_points_possible += question.points

                    # Get the feedback for this answer
                    feedback = db.query(AIFeedback).filter(
                        AIFeedback.answer_id == answer.id
                    ).first()

                    if feedback and feedback.points_earned is not None:
                        total_points_earned += feedback.points_earned

            # Calculate percentage
            percentage_score = (total_points_earned / total_points_possible * 100) if total_points_possible > 0 else 0

            # Update the test submission
            submission = db.query(TestSubmission).filter(
                TestSubmission.student_id == student_id,
                TestSubmission.module_id == UUID(module_id),
                TestSubmission.attempt == attempt
            ).first()

            if submission:
                submission.total_points_possible = total_points_possible
                submission.total_points_earned = total_points_earned
                submission.percentage_score = percentage_score
                db.commit()
                logger.info(f"✅ Test score updated: {total_points_earned}/{total_points_possible} points ({percentage_score:.1f}%)")
            else:
                logger.warning(f"⚠️  Test submission not found for attempt {attempt}")

        except Exception as score_error:
            logger.error(f"❌ Failed to calculate total score: {str(score_error)}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()

    except Exception as e:
        logger.error(f"❌ Background feedback generation failed: {str(e)}")
        import traceback
        traceback.print_exc()


# 🔍 Join module with access code
@router.post("/join-module", response_model=ModuleOut)
def join_module_with_code(
    access_code: str = Query(..., description="Module access code"),
    student_id: str = Query(None, description="Student Banner ID"),
    module_id: str = Query(None, description="Module ID (optional)"),
    db: Session = Depends(get_db)
):
    """
    Allow students to join a module using access code.
    Creates an enrollment record if student_id is provided.
    """
    from app.models.student_enrollment import StudentEnrollment
    from datetime import datetime, timezone

    print(f"🔍 Searching for access code: '{access_code}' (length: {len(access_code)})")

    # Debug: Check all modules and their access codes
    all_modules = db.query(Module).all()
    print(f"📊 Total modules in database: {len(all_modules)}")
    for i, mod in enumerate(all_modules[:5]):  # Show first 5 modules
        print(f"  Module {i+1}: name='{mod.name}', access_code='{mod.access_code}', active={mod.is_active}")

    # Try exact match first
    module = get_module_by_access_code(db, access_code.strip())
    if not module:
        # Try uppercase match
        module = get_module_by_access_code(db, access_code.strip().upper())
        if not module:
            # Try case-insensitive search
            module = db.query(Module).filter(Module.access_code.ilike(access_code.strip())).first()
            if not module:
                print(f"❌ No module found with access code: '{access_code}'")
                raise HTTPException(status_code=404, detail="Invalid access code")

    print(f"✅ Found module: '{module.name}' with access code: '{module.access_code}'")

    if not module.is_active:
        raise HTTPException(status_code=400, detail="Module is not active")

    # Create enrollment record if student_id is provided
    if student_id:
        # Check if already enrolled
        existing_enrollment = db.query(StudentEnrollment).filter(
            StudentEnrollment.student_id == student_id,
            StudentEnrollment.module_id == module.id
        ).first()

        if not existing_enrollment:
            # Create new enrollment
            enrollment = StudentEnrollment(
                student_id=student_id,
                module_id=module.id,
                access_code_used=access_code.strip().upper(),
                enrolled_at=datetime.now(timezone.utc)
            )
            db.add(enrollment)
            db.commit()
            db.refresh(enrollment)
            print(f"✅ Created enrollment for student {student_id} in module {module.name}")
        else:
            print(f"ℹ️ Student {student_id} already enrolled in module {module.name}")

    return module

# 📄 Get all documents in a module (for assignments)
@router.get("/modules/{module_id}/documents", response_model=List[DocumentOut])
def get_module_documents(
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get all non-testbank documents in a module (supporting materials only)
    """
    module = get_module_by_id(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get documents but exclude test banks for student safety
    documents = get_documents_by_module_for_students(db, module_id)
    return documents

# ❓ Get all questions for a module (the assignment)
@router.get("/modules/{module_id}/questions", response_model=List[QuestionOut])
def get_module_questions(
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get all ACTIVE questions for a module (this is the assignment).
    Students only see questions that have been approved by teachers.
    """
    from app.crud.question import get_questions_by_status
    from app.models.question import QuestionStatus

    module = get_module_by_id(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # SECURITY: Only return active questions to students
    questions = get_questions_by_status(db, module_id, QuestionStatus.ACTIVE)
    print(f"🔒 Student endpoint: Returning {len(questions)} active questions for module {module_id}")
    return questions

# ❓ Get all questions for a document (assignment)
@router.get("/documents/{document_id}/questions", response_model=List[QuestionOut])
def get_assignment_questions(
    document_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get all ACTIVE questions for a specific document/assignment.
    Students only see questions that have been approved by teachers.
    """
    from app.crud.document import get_document_by_id
    from app.models.question import Question, QuestionStatus

    document = get_document_by_id(db, str(document_id))
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # SECURITY: Only return active questions to students
    questions = db.query(Question).filter(
        Question.document_id == document_id,
        Question.status == QuestionStatus.ACTIVE
    ).order_by(Question.question_order.nulls_last(), Question.id).all()

    print(f"🔒 Student endpoint: Returning {len(questions)} active questions for document {document_id}")
    return questions

# ✅ Submit answer for a question with instant AI feedback
@router.post("/submit-answer")
def submit_student_answer(
    answer_data: StudentAnswerCreate,
    db: Session = Depends(get_db)
):
    """
    Submit student answer for a question with instant AI feedback on first attempt
    """
    from app.services.ai_feedback import AIFeedbackService
    from app.crud.question import get_question_by_id
    
    # Check if answer already exists for this attempt
    existing_answer = get_student_answer(
        db, answer_data.student_id, answer_data.question_id, answer_data.attempt
    )
    
    if existing_answer:
        # Update existing answer
        update_data = StudentAnswerUpdate(answer=answer_data.answer)
        updated_answer = update_student_answer(db, existing_answer.id, update_data)
        created_answer = updated_answer
    else:
        # Create new answer
        created_answer = create_student_answer(db, answer_data)
    
    # Get module settings to determine max attempts
    question = get_question_by_id(db, str(answer_data.question_id))
    if not question:
        return {
            "success": True,
            "answer": created_answer,
            "feedback": None,
            "message": "Answer submitted but question not found"
        }

    # SECURITY: Check if question is active before accepting answer
    from app.models.question import QuestionStatus
    if question.status != QuestionStatus.ACTIVE:
        raise HTTPException(
            status_code=403,
            detail="This question is not yet available. Please contact your teacher."
        )

    module_id = str(question.module_id)
    module = get_module_by_id(db, module_id)

    # Get max attempts from module settings (default to 2)
    max_attempts = 2
    if module and module.assignment_config:
        multiple_attempts_config = module.assignment_config.get("features", {}).get("multiple_attempts", {})
        max_attempts = multiple_attempts_config.get("max_attempts", 2)

    # Generate feedback for all attempts EXCEPT the final/last attempt
    # Example: max_attempts=2 → feedback on attempt 1, no feedback on attempt 2
    # Example: max_attempts=3 → feedback on attempts 1 and 2, no feedback on attempt 3
    should_generate_feedback = answer_data.attempt < max_attempts

    if should_generate_feedback:
        try:
            print(f"🎯 ENDPOINT: should_generate_feedback=True, attempt={answer_data.attempt}, max_attempts={max_attempts}")
            print(f"🎯 ENDPOINT: created_answer.id={created_answer.id}, answer_data={created_answer.answer}")

            # Generate AI feedback
            feedback_service = AIFeedbackService()
            print(f"🎯 ENDPOINT: Calling generate_instant_feedback...")
            feedback = feedback_service.generate_instant_feedback(
                db=db,
                student_answer=created_answer,
                question_id=str(answer_data.question_id),
                module_id=module_id
            )
            print(f"🎯 ENDPOINT: Feedback generated, checking if saved...")

            # Return enhanced response with feedback
            return {
                "success": True,
                "answer": {
                    "id": str(created_answer.id),
                    "student_id": created_answer.student_id,
                    "question_id": str(created_answer.question_id),
                    "document_id": str(created_answer.document_id),
                    "answer": created_answer.answer,
                    "attempt": created_answer.attempt,
                    "submitted_at": created_answer.submitted_at.isoformat()
                },
                "feedback": feedback,
                "attempt_number": answer_data.attempt,
                "can_retry": not feedback.get("is_correct", False) and answer_data.attempt < max_attempts,
                "max_attempts": max_attempts
            }

        except Exception as e:
            # If feedback generation fails, still return successful answer submission
            return {
                "success": True,
                "answer": created_answer,
                "feedback": None,
                "error": f"Answer submitted but feedback failed: {str(e)}"
            }

    else:
        # For final attempt, return result without feedback
        return {
            "success": True,
            "answer": created_answer,
            "attempt_number": answer_data.attempt,
            "max_attempts": max_attempts,
            "final_submission": True,
            "message": "Final answer submitted successfully"
        }

# 📊 Get student's answers for a document
@router.get("/documents/{document_id}/my-answers", response_model=List[StudentAnswerOut])
def get_my_answers(
    document_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1, le=5),
    db: Session = Depends(get_db)
):
    """
    Get student's submitted answers for a document
    """
    answers = get_student_answers_by_document(db, student_id, document_id, attempt)
    return answers

# 📈 Get student's progress for a document
@router.get("/documents/{document_id}/progress")
def get_assignment_progress(
    document_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1, le=5),
    db: Session = Depends(get_db)
):
    """
    Get student's progress for an assignment
    """
    progress = get_student_progress(db, student_id, document_id, attempt)
    return progress

# ✏️ Update student answer
@router.put("/answers/{answer_id}", response_model=StudentAnswerOut)
def update_my_answer(
    answer_id: UUID,
    answer_data: StudentAnswerUpdate,
    db: Session = Depends(get_db)
):
    """
    Update student's answer (only if not completed)
    """
    updated_answer = update_student_answer(db, answer_id, answer_data)
    if not updated_answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    return updated_answer

# 🗑️ Delete student answer
@router.delete("/answers/{answer_id}")
def delete_my_answer(
    answer_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete student's answer (only if not completed)
    """
    deleted_answer = delete_student_answer(db, answer_id)
    if not deleted_answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    return {"detail": "Answer deleted successfully"}

# 🎯 Get specific student answer
@router.get("/questions/{question_id}/my-answer")
def get_my_answer_for_question(
    question_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1, le=5),
    db: Session = Depends(get_db)
):
    """
    Get student's answer for a specific question
    """
    answer = get_student_answer(db, student_id, question_id, attempt)
    if not answer:
        return None
    return answer

# 📊 Get student's answers for a module (optimized batch loading)
@router.get("/modules/{module_id}/my-answers", response_model=List[StudentAnswerOut])
def get_my_module_answers(
    module_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1, le=5),
    db: Session = Depends(get_db)
):
    """
    Get all student's answers for a module in one request (performance optimized)
    """
    from app.models.student_answer import StudentAnswer
    from app.models.question import Question

    # Get all answers for this student in this module
    try:
        # Try new schema first (with module_id)
        answers = db.query(StudentAnswer).filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.module_id == module_id,
            StudentAnswer.attempt == attempt
        ).all()
    except Exception:
        # Fallback to old schema (via document_id)
        from app.models.document import Document
        answers = db.query(StudentAnswer).join(Question).join(Document).filter(
            StudentAnswer.student_id == student_id,
            Document.module_id == module_id,
            StudentAnswer.attempt == attempt
        ).all()

    return answers

# 📈 Get student's progress for a module
@router.get("/modules/{module_id}/progress")
def get_module_progress(
    module_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1, le=5),
    db: Session = Depends(get_db)
):
    """
    Get student's progress for all questions in a module
    """
    from app.crud.student_answer import get_student_progress_by_module

    progress = get_student_progress_by_module(db, student_id, module_id, attempt)
    return progress

# 🧠 Get all AI feedback for a student in a module
@router.get("/modules/{module_id}/feedback")
def get_module_feedback(
    module_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    db: Session = Depends(get_db)
):
    """
    Get all AI feedback for a student in a module (student-friendly view)
    Returns filtered feedback without technical metadata, including teacher grades if available
    IMPORTANT: Also includes teacher-only grades (where teacher graded but no AI feedback exists)
    """
    from app.crud.ai_feedback import get_student_module_feedback
    from app.models.student_answer import StudentAnswer
    from app.models.teacher_grade import TeacherGrade
    from app.models.question import Question

    # Get all feedback for student
    feedback_list = get_student_module_feedback(db, student_id, module_id)

    # Track which answer_ids we've processed (to avoid duplicates)
    processed_answer_ids = set()

    # Transform to student-friendly format
    student_feedback = []
    for feedback in feedback_list:
        # Get the associated answer to find question_id
        answer = db.query(StudentAnswer).filter(StudentAnswer.id == feedback.answer_id).first()
        if not answer:
            continue

        processed_answer_ids.add(feedback.answer_id)

        # Check if teacher has graded this answer
        teacher_grade = db.query(TeacherGrade).filter(
            TeacherGrade.answer_id == feedback.answer_id
        ).first()

        # Extract only student-relevant fields from feedback_data
        data = feedback.feedback_data or {}

        student_view = {
            "id": str(feedback.id),
            "answer_id": str(feedback.answer_id),  # Include answer_id for frontend mapping
            "question_id": str(answer.question_id),
            "attempt": answer.attempt,  # Include attempt number for frontend grouping
            "is_correct": feedback.is_correct,
            "score": feedback.score,
            "correctness_score": feedback.score,  # Alias for frontend compatibility
            "explanation": data.get("explanation", ""),
            "improvement_hint": data.get("improvement_hint"),
            "concept_explanation": data.get("concept_explanation"),
            "strengths": data.get("strengths"),
            "weaknesses": data.get("weaknesses"),
            "generated_at": feedback.generated_at.isoformat() if feedback.generated_at else None,
            # Points and rubric-based scoring
            "points_earned": feedback.points_earned,
            "points_possible": feedback.points_possible,
            "criterion_scores": feedback.criterion_scores,  # Rubric breakdown
            # Only show RAG usage as boolean, not sources
            "has_course_materials": data.get("used_rag", False),
            # For MCQ, include answer info
            "selected_option": data.get("selected_option"),
            "correct_option": data.get("correct_option"),
            "available_options": data.get("available_options"),
            # For new question types, include grading details
            "grading_details": data.get("grading_details"),  # blank_results, sub_results, etc.
            "selected_options": data.get("selected_options"),  # For MCQ Multiple
            "sub_results": data.get("sub_results"),  # For Multi-Part
            # Teacher grade if available
            "teacher_grade": {
                "points_awarded": teacher_grade.points_awarded,
                "feedback_text": teacher_grade.feedback_text,
                "graded_at": teacher_grade.graded_at.isoformat() if teacher_grade.graded_at else None
            } if teacher_grade else None,
            "is_teacher_graded": teacher_grade is not None
        }

        student_feedback.append(student_view)

    # IMPORTANT: Also get teacher grades that don't have AI feedback yet
    # This happens when teacher manually grades without AI feedback being generated
    teacher_only_grades = db.query(TeacherGrade).filter(
        TeacherGrade.student_id == student_id,
        TeacherGrade.module_id == module_id,
        ~TeacherGrade.answer_id.in_(processed_answer_ids) if processed_answer_ids else True
    ).all()

    for teacher_grade in teacher_only_grades:
        # Get the answer and question details
        answer = db.query(StudentAnswer).filter(StudentAnswer.id == teacher_grade.answer_id).first()
        if not answer:
            continue

        question = db.query(Question).filter(Question.id == answer.question_id).first()
        if not question:
            continue

        # Create a feedback entry with only teacher grade (no AI feedback)
        student_view = {
            "id": None,  # No AI feedback ID
            "answer_id": str(answer.id),
            "question_id": str(answer.question_id),
            "attempt": answer.attempt,
            "is_correct": None,  # No AI feedback
            "score": None,
            "correctness_score": None,
            "explanation": "",
            "improvement_hint": None,
            "concept_explanation": None,
            "strengths": None,
            "weaknesses": None,
            "generated_at": None,
            "points_earned": None,  # AI didn't score this
            "points_possible": question.points,
            "criterion_scores": None,
            "has_course_materials": False,
            "selected_option": None,
            "correct_option": None,
            "available_options": None,
            "grading_details": None,
            "selected_options": None,
            "sub_results": None,
            # Teacher grade (the main data here)
            "teacher_grade": {
                "points_awarded": teacher_grade.points_awarded,
                "feedback_text": teacher_grade.feedback_text,
                "graded_at": teacher_grade.graded_at.isoformat() if teacher_grade.graded_at else None
            },
            "is_teacher_graded": True
        }

        student_feedback.append(student_view)

    return student_feedback

# 🧠 Get AI feedback for a specific question
@router.get("/questions/{question_id}/feedback")
def get_question_feedback(
    question_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1, le=5),
    db: Session = Depends(get_db)
):
    """
    Get AI feedback for a specific student's answer to a question
    """
    from app.crud.ai_feedback import get_feedback_by_answer

    # First get the student answer
    answer = get_student_answer(db, student_id, question_id, attempt)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    # Then get feedback for that answer
    feedback = get_feedback_by_answer(db, answer.id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return feedback

# 📝 Save answer (for auto-save, without feedback generation)
@router.post("/save-answer")
def save_student_answer(
    answer_data: StudentAnswerCreate,
    db: Session = Depends(get_db)
):
    """
    Save student answer as draft (auto-save functionality).
    This does NOT generate feedback - it only saves the answer.

    VALIDATION: If answer is empty or whitespace-only, existing answer is deleted
    instead of saving empty data to the database.
    """
    # SECURITY: Verify question is active before allowing save
    from app.crud.question import get_question_by_id
    from app.models.question import QuestionStatus
    from app.crud.student_answer import delete_student_answer

    question = get_question_by_id(db, str(answer_data.question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.status != QuestionStatus.ACTIVE:
        raise HTTPException(
            status_code=403,
            detail="This question is not yet available. Please contact your teacher."
        )

    # VALIDATION: Check if answer content is empty or whitespace-only
    answer_content = None
    is_empty = False

    if isinstance(answer_data.answer, dict):
        # Check for different answer formats based on question type
        if "blanks" in answer_data.answer:
            # Fill-in-the-Blank: Check if any blanks have non-empty values
            blanks = answer_data.answer.get("blanks", {})
            is_empty = not blanks or not any(str(v).strip() for v in blanks.values())
        elif "selected_options" in answer_data.answer:
            # MCQ Multiple: Check if array is non-empty
            selected_options = answer_data.answer.get("selected_options", [])
            is_empty = not selected_options or len(selected_options) == 0
        elif "sub_answers" in answer_data.answer:
            # Multi-Part: Check if any sub-answers have non-empty values
            sub_answers = answer_data.answer.get("sub_answers", {})
            is_empty = not sub_answers or len(sub_answers) == 0
        else:
            # Traditional answer formats (MCQ, Short, Long)
            answer_content = (
                answer_data.answer.get("text_response") or
                answer_data.answer.get("selected_option_id") or
                answer_data.answer.get("selected_option") or
                ""
            )
            is_empty = not answer_content or not str(answer_content).strip()
    elif isinstance(answer_data.answer, str):
        answer_content = answer_data.answer
        is_empty = not answer_content or not str(answer_content).strip()
    else:
        is_empty = True

    # Check if answer already exists for this attempt
    existing_answer = get_student_answer(
        db, answer_data.student_id, answer_data.question_id, answer_data.attempt
    )

    if is_empty:
        # If answer is empty/whitespace, delete existing record (if any)
        if existing_answer:
            delete_student_answer(db, existing_answer.id)
            logger.info(f"🗑️ Deleted empty answer for question {answer_data.question_id}, attempt {answer_data.attempt}")
            return {
                "success": True,
                "answer": None,
                "message": "Empty answer removed"
            }
        else:
            # No existing answer and new answer is empty - nothing to do
            logger.info(f"⏭️ Skipped saving empty answer for question {answer_data.question_id}")
            return {
                "success": True,
                "answer": None,
                "message": "Empty answer not saved"
            }

    # Answer has content - proceed with normal save logic
    if existing_answer:
        # Update existing answer
        update_data = StudentAnswerUpdate(answer=answer_data.answer)
        updated_answer = update_student_answer(db, existing_answer.id, update_data)
        return {
            "success": True,
            "answer": updated_answer,
            "message": "Answer saved as draft"
        }
    else:
        # Create new answer
        created_answer = create_student_answer(db, answer_data)
        return {
            "success": True,
            "answer": created_answer,
            "message": "Answer saved as draft"
        }

# 🎯 Submit entire test with feedback generation
@router.post("/modules/{module_id}/submit-test")
def submit_test(
    module_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Mark a test as submitted for a specific attempt.
    This creates a TestSubmission record and triggers ASYNC feedback generation.
    Returns immediately - feedback is generated in the background.
    """
    from app.crud.test_submission import (
        create_submission,
        has_submitted_attempt,
        get_current_attempt_number
    )
    from app.models.student_answer import StudentAnswer

    # Check if already submitted
    if has_submitted_attempt(db, student_id, module_id, attempt):
        raise HTTPException(
            status_code=400,
            detail=f"Test already submitted for attempt {attempt}"
        )

    # Get module settings
    module = get_module_by_id(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Get max attempts from module settings
    max_attempts = 2
    if module.assignment_config:
        multiple_attempts_config = module.assignment_config.get("features", {}).get("multiple_attempts", {})
        max_attempts = multiple_attempts_config.get("max_attempts", 2)

    # Check if attempt number is valid
    if attempt > max_attempts:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {max_attempts} attempts allowed"
        )

    # Get all answers for this attempt
    answers = db.query(StudentAnswer).filter(
        StudentAnswer.student_id == student_id,
        StudentAnswer.module_id == module_id,
        StudentAnswer.attempt == attempt
    ).all()

    if not answers:
        raise HTTPException(
            status_code=400,
            detail="No answers found to submit"
        )

    # Create submission record
    submission = create_submission(
        db=db,
        student_id=student_id,
        module_id=module_id,
        attempt=attempt,
        questions_count=len(answers)
    )

    logger.info(f"✅ Test submitted - {len(answers)} questions")

    # Trigger async feedback generation ONLY if not final attempt
    if attempt < max_attempts:
        answer_ids = [str(answer.id) for answer in answers]
        logger.info(f"🚀 Triggering background feedback generation for {len(answer_ids)} answers")

        # Add background task
        if background_tasks:
            background_tasks.add_task(
                generate_feedback_background,
                student_id=student_id,
                module_id=str(module_id),
                attempt=attempt,
                answer_ids=answer_ids
            )

        return {
            "success": True,
            "submission_id": str(submission.id),
            "attempt": attempt,
            "questions_submitted": len(answers),
            "can_retry": True,
            "max_attempts": max_attempts,
            "feedback_status": "generating",  # NEW: indicates feedback is being generated
            "message": "Test submitted! Feedback is being generated in the background."
        }
    else:
        # Final attempt - no feedback
        return {
            "success": True,
            "submission_id": str(submission.id),
            "attempt": attempt,
            "questions_submitted": len(answers),
            "can_retry": False,
            "max_attempts": max_attempts,
            "feedback_status": "none",  # No feedback for final attempt
            "message": "Final attempt submitted successfully!"
        }

# 📊 Get submission status for a student in a module
@router.get("/modules/{module_id}/submission-status")
def get_submission_status(
    module_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    db: Session = Depends(get_db)
):
    """
    Get submission status for a student in a module.
    Returns which attempts have been submitted and current attempt number.
    """
    from app.crud.test_submission import (
        get_all_submissions,
        get_current_attempt_number,
        get_submission_count
    )

    # Get module settings for max attempts
    module = get_module_by_id(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    max_attempts = 2
    if module.assignment_config:
        multiple_attempts_config = module.assignment_config.get("features", {}).get("multiple_attempts", {})
        max_attempts = multiple_attempts_config.get("max_attempts", 2)

    # Get all submissions
    submissions = get_all_submissions(db, student_id, module_id)
    current_attempt = get_current_attempt_number(db, student_id, module_id)
    submission_count = get_submission_count(db, student_id, module_id)

    return {
        "student_id": student_id,
        "module_id": str(module_id),
        "submissions": [
            {
                "attempt": sub.attempt,
                "submitted_at": sub.submitted_at.isoformat(),
                "questions_count": sub.questions_count
            }
            for sub in submissions
        ],
        "current_attempt": current_attempt if current_attempt <= max_attempts else max_attempts,
        "submission_count": submission_count,
        "can_submit_again": submission_count < max_attempts,
        "max_attempts": max_attempts,
        "all_attempts_done": submission_count >= max_attempts
    }


# 🔄 Check feedback generation status (for real-time updates)
@router.get("/modules/{module_id}/feedback-status")
def get_feedback_status(
    module_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    attempt: int = Query(1, description="Attempt number", ge=1),
    db: Session = Depends(get_db)
):
    """
    Check the status of feedback generation for a student's test submission.
    Returns which questions have feedback ready and which are still pending.
    Used for real-time polling in the frontend.
    """
    from app.models.student_answer import StudentAnswer
    from app.crud.ai_feedback import get_feedback_by_answer

    # Get all answers for this attempt
    answers = db.query(StudentAnswer).filter(
        StudentAnswer.student_id == student_id,
        StudentAnswer.module_id == module_id,
        StudentAnswer.attempt == attempt
    ).all()

    if not answers:
        return {
            "total_questions": 0,
            "feedback_ready": 0,
            "feedback_pending": 0,
            "questions": [],
            "all_complete": True
        }

    # Check which answers have feedback
    feedback_status = []
    ready_count = 0

    for answer in answers:
        feedback = get_feedback_by_answer(db, answer.id)
        has_feedback = feedback is not None

        if has_feedback:
            ready_count += 1

        feedback_status.append({
            "question_id": str(answer.question_id),
            "answer_id": str(answer.id),
            "has_feedback": has_feedback,
            "feedback_id": str(feedback.id) if feedback else None
        })

    total = len(answers)
    pending = total - ready_count
    all_complete = ready_count == total

    return {
        "total_questions": total,
        "feedback_ready": ready_count,
        "feedback_pending": pending,
        "progress_percentage": int((ready_count / total) * 100) if total > 0 else 0,
        "all_complete": all_complete,
        "questions": feedback_status
    }

# 💬 Submit or update feedback critique (student rates AI feedback)
@router.post("/feedback/{feedback_id}/critique")
def create_or_update_feedback_critique(
    feedback_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    rating: int = Query(..., description="Rating from 1-5", ge=1, le=5),
    comment: str = Query(None, description="Optional comment"),
    feedback_type: str = Query(None, description="Category: helpful, not_helpful, incorrect, too_vague, too_harsh"),
    db: Session = Depends(get_db)
):
    """
    Allow students to rate and comment on AI-generated feedback.
    This helps improve feedback quality by collecting student opinions.
    If student has already critiqued this feedback, updates the existing critique.
    """
    from app.models.feedback_critique import FeedbackCritique
    from app.models.ai_feedback import AIFeedback

    # Verify feedback exists
    feedback = db.query(AIFeedback).filter(AIFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Check if student has already critiqued this feedback
    existing_critique = db.query(FeedbackCritique).filter(
        FeedbackCritique.feedback_id == feedback_id,
        FeedbackCritique.student_id == student_id
    ).first()

    if existing_critique:
        # Update existing critique
        existing_critique.rating = rating
        existing_critique.comment = comment
        existing_critique.feedback_type = feedback_type
        from datetime import datetime, timezone
        existing_critique.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_critique)

        logger.info(f"✏️ Student {student_id} updated critique for feedback {feedback_id}: {rating}/5")

        return {
            "success": True,
            "critique_id": str(existing_critique.id),
            "message": "Feedback critique updated successfully",
            "critique": {
                "id": str(existing_critique.id),
                "feedback_id": str(existing_critique.feedback_id),
                "rating": existing_critique.rating,
                "comment": existing_critique.comment,
                "feedback_type": existing_critique.feedback_type,
                "created_at": existing_critique.created_at.isoformat(),
                "updated_at": existing_critique.updated_at.isoformat()
            }
        }
    else:
        # Create new critique
        critique = FeedbackCritique(
            feedback_id=feedback_id,
            student_id=student_id,
            rating=rating,
            comment=comment,
            feedback_type=feedback_type
        )
        db.add(critique)
        db.commit()
        db.refresh(critique)

        logger.info(f"💬 Student {student_id} critiqued feedback {feedback_id}: {rating}/5")

        return {
            "success": True,
            "critique_id": str(critique.id),
            "message": "Feedback critique submitted successfully",
            "critique": {
                "id": str(critique.id),
                "feedback_id": str(critique.feedback_id),
                "rating": critique.rating,
                "comment": critique.comment,
                "feedback_type": critique.feedback_type,
                "created_at": critique.created_at.isoformat(),
                "updated_at": critique.updated_at.isoformat()
            }
        }

# 📊 Get feedback critique for a specific feedback
@router.get("/feedback/{feedback_id}/critique")
def get_feedback_critique(
    feedback_id: UUID,
    student_id: str = Query(..., description="Student ID"),
    db: Session = Depends(get_db)
):
    """
    Get student's critique of a specific feedback (if it exists)
    """
    from app.models.feedback_critique import FeedbackCritique

    critique = db.query(FeedbackCritique).filter(
        FeedbackCritique.feedback_id == feedback_id,
        FeedbackCritique.student_id == student_id
    ).first()

    if not critique:
        return {
            "has_critique": False,
            "critique": None
        }

    return {
        "has_critique": True,
        "critique": {
            "id": str(critique.id),
            "feedback_id": str(critique.feedback_id),
            "rating": critique.rating,
            "comment": critique.comment,
            "feedback_type": critique.feedback_type,
            "created_at": critique.created_at.isoformat(),
            "updated_at": critique.updated_at.isoformat()
        }
    }

# 📈 Get all feedback critiques for a module (for analytics/teacher view)
@router.get("/modules/{module_id}/feedback-critiques")
def get_module_feedback_critiques(
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get all feedback critiques for a module.
    Useful for teachers to see what students think about AI feedback quality.
    """
    from app.models.feedback_critique import FeedbackCritique
    from app.models.ai_feedback import AIFeedback
    from app.models.student_answer import StudentAnswer

    # Get all feedback for this module
    feedbacks = db.query(AIFeedback).join(StudentAnswer).filter(
        StudentAnswer.module_id == module_id
    ).all()

    feedback_ids = [fb.id for fb in feedbacks]

    # Get all critiques for these feedbacks
    critiques = db.query(FeedbackCritique).filter(
        FeedbackCritique.feedback_id.in_(feedback_ids)
    ).all()

    # Calculate statistics
    total_critiques = len(critiques)
    if total_critiques == 0:
        return {
            "module_id": str(module_id),
            "total_critiques": 0,
            "average_rating": None,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "feedback_types": {},
            "critiques": []
        }

    # Calculate statistics
    ratings = [c.rating for c in critiques]
    average_rating = sum(ratings) / len(ratings)

    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings:
        rating_distribution[rating] += 1

    feedback_types = {}
    for critique in critiques:
        if critique.feedback_type:
            feedback_types[critique.feedback_type] = feedback_types.get(critique.feedback_type, 0) + 1

    return {
        "module_id": str(module_id),
        "total_critiques": total_critiques,
        "total_feedbacks": len(feedbacks),
        "critique_rate": round((total_critiques / len(feedbacks) * 100), 1) if feedbacks else 0,
        "average_rating": round(average_rating, 2),
        "rating_distribution": rating_distribution,
        "feedback_types": feedback_types,
        "critiques": [
            {
                "id": str(c.id),
                "feedback_id": str(c.feedback_id),
                "student_id": c.student_id,
                "rating": c.rating,
                "comment": c.comment,
                "feedback_type": c.feedback_type,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat()
            }
            for c in critiques
        ]
    }