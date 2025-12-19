#!/usr/bin/env python3
"""
Test script to verify ai_feedback model imports and works correctly
"""

try:
    print("1. Testing basic imports...")
    from app.database import Base, engine
    print("   ✅ Database imports successful")

    print("\n2. Testing ai_feedback model import...")
    from app.models.ai_feedback import AIFeedback
    print("   ✅ AIFeedback model imported successfully")

    print("\n3. Testing all models import...")
    from app.models import (
        User, Document, Question, Module,
        StudentAnswer, AIFeedback,
        DocumentChunk, DocumentEmbedding
    )
    print("   ✅ All models imported successfully")

    print("\n4. Testing table creation...")
    Base.metadata.create_all(bind=engine)
    print("   ✅ Tables created successfully")

    print("\n5. Checking ai_feedback table columns...")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    columns = inspector.get_columns('ai_feedback')
    print(f"   ✅ ai_feedback table has {len(columns)} columns:")
    for col in columns:
        print(f"      - {col['name']}: {col['type']}")

    print("\n✅ All tests passed! The ai_feedback model is working correctly.")
    print("\n📝 You can now restart your backend server:")
    print("   uvicorn main:app --reload")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    print("\n💡 Possible fixes:")
    print("   1. Make sure you're in the Backend directory")
    print("   2. Activate virtual environment: source venv/bin/activate")
    print("   3. Check database connection in .env file")
