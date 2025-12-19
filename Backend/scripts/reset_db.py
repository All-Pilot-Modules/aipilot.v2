"""
Complete database reset script - creates all tables
Run this after dropping and recreating the database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base

# Import ALL models so they're registered with Base.metadata
from app.models.user import User
from app.models.document import Document
from app.models.question import Question
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding
from app.models.student_answer import StudentAnswer
from app.models.ai_feedback import AIFeedback
from app.models.test_submission import TestSubmission  # ✅ NEW
from app.models.module import Module

def reset_database():
    """Drop all tables and recreate them"""
    print("🗑️  Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ All tables dropped")

    print("\n📊 Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

    print("\n📋 Tables created:")
    print("  - users")
    print("  - modules")
    print("  - documents")
    print("  - document_chunks")
    print("  - document_embeddings")
    print("  - questions")
    print("  - student_answers")
    print("  - ai_feedback")
    print("  - test_submissions ✨ NEW")

    print("\n🎉 Database reset complete!")
    print("\n💡 Next steps:")
    print("  1. Start your backend server")
    print("  2. Upload a document via the dashboard")
    print("  3. Generate questions")
    print("  4. Test the student flow")

if __name__ == "__main__":
    reset_database()
