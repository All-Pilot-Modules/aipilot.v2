"""
Quick script to set correct answers for ALL questions that don't have one
This auto-detects MCQ questions and sets correct_option_id to the first option
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.question import Question

def set_correct_answers():
    db = SessionLocal()

    print("🔧 Auto-setting correct answers for questions...")

    # Get all questions without correct answers
    questions = db.query(Question).all()
    updated_count = 0

    for question in questions:
        # Skip if already has correct answer
        if question.correct_option_id or question.correct_answer:
            continue

        if question.type == 'mcq' and question.options:
            # For MCQ, set to first option by default
            first_option_id = sorted(question.options.keys())[0]
            question.correct_option_id = first_option_id
            print(f"✅ MCQ: '{question.text[:50]}...' → correct_option_id = '{first_option_id}'")
            print(f"   Options: {question.options}")
            print(f"   ⚠️  PLEASE VERIFY THIS IS CORRECT!")
            updated_count += 1
        elif question.type in ['short', 'essay', 'long']:
            # For text questions, set a placeholder
            question.correct_answer = "Sample answer - instructor should update this"
            print(f"✅ TEXT: '{question.text[:50]}...' → correct_answer = placeholder")
            updated_count += 1

    if updated_count > 0:
        db.commit()
        print(f"\n✅ Updated {updated_count} questions")
        print(f"\n⚠️  IMPORTANT: Review the MCQ correct answers above and update if needed!")
    else:
        print(f"\n✅ All questions already have correct answers!")

    db.close()

if __name__ == "__main__":
    set_correct_answers()
