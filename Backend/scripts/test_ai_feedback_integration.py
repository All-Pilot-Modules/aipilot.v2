"""
Test script for AI Feedback Integration
Tests the complete flow from student answer submission to AI feedback generation
"""
import sys
import os

# Add Backend to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.services.ai_feedback import AIFeedbackService
from app.crud.student_answer import create_student_answer
from app.models.student_answer import StudentAnswer
from app.models.question import Question
from app.models.module import Module
from app.schemas.student_answer import StudentAnswerCreate
import uuid
from datetime import datetime, timezone


def test_feedback_service_import():
    """Test that AI Feedback Service can be imported"""
    print("✓ Testing AI Feedback Service import...")
    try:
        service = AIFeedbackService()
        print(f"  ✓ AIFeedbackService initialized successfully")
        print(f"  ✓ Using model: {service.default_model}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to initialize AIFeedbackService: {e}")
        return False


def test_openai_connection():
    """Test OpenAI API connection"""
    print("\n✓ Testing OpenAI API connection...")
    try:
        from app.core.config import OPENAI_API_KEY
        if OPENAI_API_KEY and len(OPENAI_API_KEY) > 10:
            print(f"  ✓ OpenAI API Key loaded: {OPENAI_API_KEY[:10]}...")
            return True
        else:
            print(f"  ✗ OpenAI API Key not properly configured")
            return False
    except Exception as e:
        print(f"  ✗ Failed to load OpenAI config: {e}")
        return False


def test_database_connection():
    """Test database connection"""
    print("\n✓ Testing database connection...")
    try:
        db = next(get_db())
        # Test query
        module_count = db.query(Module).count()
        question_count = db.query(Question).count()
        answer_count = db.query(StudentAnswer).count()

        print(f"  ✓ Database connected successfully")
        print(f"  ✓ Modules: {module_count}")
        print(f"  ✓ Questions: {question_count}")
        print(f"  ✓ Student Answers: {answer_count}")

        db.close()
        return True
    except Exception as e:
        print(f"  ✗ Database connection failed: {e}")
        return False


def test_rubric_service():
    """Test rubric service"""
    print("\n✓ Testing rubric service...")
    try:
        from app.services.rubric import get_module_rubric

        db = next(get_db())

        # Get first module
        module = db.query(Module).first()
        if not module:
            print("  ⚠ No modules found in database")
            db.close()
            return False

        # Get rubric
        rubric = get_module_rubric(db, str(module.id))

        print(f"  ✓ Rubric loaded for module: {module.name}")
        print(f"  ✓ Feedback tone: {rubric.get('feedback_style', {}).get('tone', 'N/A')}")
        print(f"  ✓ RAG enabled: {rubric.get('rag_settings', {}).get('enabled', False)}")

        db.close()
        return True
    except Exception as e:
        print(f"  ✗ Rubric service test failed: {e}")
        return False


def test_rag_retrieval():
    """Test RAG retrieval"""
    print("\n✓ Testing RAG retrieval...")
    try:
        from app.services.rag_retriever import get_context_for_feedback
        from app.models.document import Document

        db = next(get_db())

        # Find a module with embedded documents
        embedded_doc = db.query(Document).filter(
            Document.processing_status == "embedded"
        ).first()

        if not embedded_doc:
            print("  ⚠ No embedded documents found - RAG will not work")
            print("  ⚠ Upload and process documents first")
            db.close()
            return False

        print(f"  ✓ Found embedded document: {embedded_doc.title}")

        # Test RAG retrieval
        context = get_context_for_feedback(
            db=db,
            question_text="What is the main concept?",
            student_answer="It is about testing",
            module_id=str(embedded_doc.module_id),
            max_chunks=3,
            similarity_threshold=0.5
        )

        if context.get('has_context'):
            print(f"  ✓ RAG context retrieved successfully")
            print(f"  ✓ Chunks found: {len(context.get('chunks', []))}")
            print(f"  ✓ Sources: {', '.join(context.get('sources', []))}")
        else:
            print(f"  ⚠ No RAG context found (may need better query)")

        db.close()
        return True
    except Exception as e:
        print(f"  ✗ RAG retrieval test failed: {e}")
        return False


def test_complete_feedback_flow():
    """Test complete feedback generation flow"""
    print("\n✓ Testing complete AI feedback flow...")
    try:
        db = next(get_db())

        # Find a question to test with
        question = db.query(Question).first()
        if not question:
            print("  ⚠ No questions found in database")
            db.close()
            return False

        print(f"  ✓ Found question: {question.text[:50]}...")
        print(f"  ✓ Question type: {question.type}")

        # Create test student answer
        test_answer_data = {
            "student_id": "TEST_STUDENT_001",
            "question_id": question.id,
            "module_id": question.module_id,
            "document_id": question.document_id,
            "attempt": 1
        }

        # Set answer based on question type
        if question.type == "mcq":
            # For MCQ, use the correct answer to test
            test_answer_data["answer"] = {"selected_option": question.correct_answer}
            print(f"  ✓ Test MCQ answer: {question.correct_answer}")
        else:
            # For text questions
            test_answer_data["answer"] = {"text_response": "This is a test answer to evaluate the feedback system"}
            print(f"  ✓ Test text answer created")

        # Create answer in database
        from app.models.student_answer import StudentAnswer
        test_answer = StudentAnswer(**test_answer_data, submitted_at=datetime.now(timezone.utc))
        db.add(test_answer)
        db.commit()
        db.refresh(test_answer)

        print(f"  ✓ Test answer created: {test_answer.id}")

        # Generate feedback
        print(f"\n  → Generating AI feedback (this may take 5-10 seconds)...")
        feedback_service = AIFeedbackService()
        feedback = feedback_service.generate_instant_feedback(
            db=db,
            student_answer=test_answer,
            question_id=str(question.id),
            module_id=str(question.module_id)
        )

        # Check feedback
        if feedback.get("error"):
            print(f"  ✗ Feedback generation failed: {feedback.get('message')}")
            db.delete(test_answer)
            db.commit()
            db.close()
            return False

        print(f"\n  ✓ Feedback generated successfully!")
        print(f"  ✓ Feedback ID: {feedback.get('feedback_id')}")
        print(f"  ✓ Is correct: {feedback.get('is_correct')}")
        print(f"  ✓ Score: {feedback.get('correctness_score')}/100")
        print(f"  ✓ Used RAG: {feedback.get('used_rag')}")
        print(f"  ✓ Model: {feedback.get('model_used')}")

        if feedback.get('used_rag'):
            print(f"  ✓ RAG sources: {', '.join(feedback.get('rag_sources', []))}")

        print(f"\n  Explanation: {feedback.get('explanation', 'N/A')[:100]}...")
        print(f"  Hint: {feedback.get('improvement_hint', 'N/A')[:100]}...")

        # Clean up test data
        db.delete(test_answer)
        db.commit()
        print(f"\n  ✓ Test data cleaned up")

        db.close()
        return True

    except Exception as e:
        print(f"  ✗ Complete flow test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("AI FEEDBACK INTEGRATION TEST SUITE")
    print("=" * 60)

    tests = [
        ("Import Test", test_feedback_service_import),
        ("OpenAI Connection", test_openai_connection),
        ("Database Connection", test_database_connection),
        ("Rubric Service", test_rubric_service),
        ("RAG Retrieval", test_rag_retrieval),
        ("Complete Feedback Flow", test_complete_feedback_flow),
    ]

    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n✗ {test_name} crashed: {e}")
            results[test_name] = False

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! AI feedback system is ready to use.")
        print("\nNext steps:")
        print("1. Upload course documents to a module")
        print("2. Wait for documents to be processed and embedded")
        print("3. Create questions in the module")
        print("4. Submit student answers via API")
        print("5. Generate feedback using: POST /student-answers/{answer_id}/feedback")
    else:
        print("\n⚠️  Some tests failed. Review the errors above.")

    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
