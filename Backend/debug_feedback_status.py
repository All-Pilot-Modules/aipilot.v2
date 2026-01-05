"""
Debug script to check feedback status in the database.
Run this to see which feedback records exist and their status.

Usage:
    python debug_feedback_status.py <module_id> <student_id> <attempt>
"""

import sys
from app.database import SessionLocal
from app.models.student_answer import StudentAnswer
from app.models.ai_feedback import AIFeedback
from sqlalchemy.orm import Session

def check_feedback_status(module_id: str, student_id: str, attempt: int):
    """Check feedback status for a module/student/attempt"""
    db = SessionLocal()

    try:
        print(f"\n{'='*80}")
        print(f"🔍 FEEDBACK STATUS CHECK")
        print(f"{'='*80}")
        print(f"Module ID: {module_id}")
        print(f"Student ID: {student_id}")
        print(f"Attempt: {attempt}")
        print(f"{'='*80}\n")

        # Get all answers
        answers = db.query(StudentAnswer).filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.module_id == module_id,
            StudentAnswer.attempt == attempt
        ).all()

        if not answers:
            print(f"❌ No answers found!\n")
            return

        print(f"✅ Found {len(answers)} answers\n")

        # Check each answer's feedback
        needs_retry = []
        complete = []
        pending = []

        for idx, answer in enumerate(answers, 1):
            feedback = db.query(AIFeedback).filter(
                AIFeedback.answer_id == answer.id
            ).first()

            print(f"{'─'*80}")
            print(f"[{idx}/{len(answers)}] Answer ID: {answer.id}")
            print(f"  Question ID: {answer.question_id}")

            if not feedback:
                print(f"  ❌ NO FEEDBACK RECORD EXISTS")
                needs_retry.append(str(answer.id))
            else:
                print(f"  Feedback ID: {feedback.id}")
                print(f"  Status: {feedback.generation_status}")
                print(f"  Progress: {feedback.generation_progress}%")
                print(f"  Data exists: {feedback.feedback_data is not None}")
                print(f"  Data empty: {not feedback.feedback_data if feedback.feedback_data is not None else 'N/A'}")
                print(f"  Score: {feedback.score}")
                print(f"  Is correct: {feedback.is_correct}")
                print(f"  Retry count: {feedback.retry_count}/{feedback.max_retries}")
                print(f"  Can retry: {feedback.can_retry}")

                # Check if needs retry
                should_retry = False
                reason = None

                if feedback.generation_status is None:
                    should_retry = True
                    reason = "generation_status is NULL"
                elif feedback.feedback_data is None:
                    should_retry = True
                    reason = "feedback_data is NULL"
                elif not feedback.feedback_data:
                    should_retry = True
                    reason = "feedback_data is empty dict"
                elif not feedback.feedback_data.get("explanation") and not feedback.feedback_data.get("feedback"):
                    should_retry = True
                    reason = "missing explanation/feedback fields"
                elif feedback.score is None and feedback.is_correct is None:
                    should_retry = True
                    reason = "score and is_correct are NULL"
                elif feedback.generation_status in ['failed', 'timeout']:
                    if feedback.can_retry:
                        should_retry = True
                        reason = f"status is {feedback.generation_status}"
                    else:
                        reason = f"status is {feedback.generation_status} but max retries exceeded"

                if should_retry:
                    print(f"  🔄 NEEDS RETRY: {reason}")
                    needs_retry.append(str(answer.id))
                elif feedback.generation_status in ['pending', 'generating']:
                    print(f"  ⏳ CURRENTLY GENERATING")
                    pending.append(str(answer.id))
                else:
                    print(f"  ✅ COMPLETE")
                    complete.append(str(answer.id))

        print(f"\n{'='*80}")
        print(f"📊 SUMMARY")
        print(f"{'='*80}")
        print(f"Total answers: {len(answers)}")
        print(f"✅ Complete: {len(complete)}")
        print(f"⏳ Pending/Generating: {len(pending)}")
        print(f"🔄 Needs retry: {len(needs_retry)}")
        print(f"\n")

        if needs_retry:
            print(f"🔄 ANSWER IDS THAT NEED RETRY:")
            for aid in needs_retry:
                print(f"  - {aid}")
            print(f"\n")

        if pending:
            print(f"⏳ ANSWER IDS CURRENTLY GENERATING:")
            for aid in pending:
                print(f"  - {aid}")
            print(f"\n")

        print(f"{'='*80}\n")

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python debug_feedback_status.py <module_id> <student_id> <attempt>")
        print("Example: python debug_feedback_status.py 123e4567-e89b-12d3-a456-426614174000 student123 1")
        sys.exit(1)

    module_id = sys.argv[1]
    student_id = sys.argv[2]
    attempt = int(sys.argv[3])

    check_feedback_status(module_id, student_id, attempt)
