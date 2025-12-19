#!/usr/bin/env python3
"""
Script to create all database tables from models.
"""

from app.database import engine, Base

# Import all models to register them with Base
from app.models.user import User

# Try to import other models (might not exist)
try:
    from app.models.module import Module
    print("✅ Module model imported")
except ImportError:
    print("⚠️  Module model not found (skipping)")

try:
    from app.models.test_submission import TestSubmission
    print("✅ TestSubmission model imported")
except ImportError:
    print("⚠️  TestSubmission model not found (skipping)")

try:
    from app.models.question import Question
    print("✅ Question model imported")
except ImportError:
    print("⚠️  Question model not found (skipping)")

try:
    from app.models.answer import Answer
    print("✅ Answer model imported")
except ImportError:
    print("⚠️  Answer model not found (skipping)")

try:
    from app.models.question_queue import QuestionQueue
    print("✅ QuestionQueue model imported")
except ImportError:
    print("⚠️  QuestionQueue model not found (skipping)")

print("\n" + "="*50)
print("Creating all database tables...")
print("="*50 + "\n")

# Create all tables
Base.metadata.create_all(bind=engine)

print("\n✅ All tables created successfully!")
print("\nTables created:")
for table in Base.metadata.sorted_tables:
    print(f"  - {table.name}")
