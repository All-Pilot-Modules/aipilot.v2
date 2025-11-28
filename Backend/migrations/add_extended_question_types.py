"""
Migration script to add extended_config field to questions table.
This enables support for new question types:
- mcq_multiple: Multiple correct answers MCQ
- fill_blank: Fill in the blanks
- multi_part: Multi-part questions (1a, 1b, 1c)

Usage:
    python migrations/add_extended_question_types.py
    python migrations/add_extended_question_types.py down  # to rollback
"""

import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def upgrade():
    """Add extended_config field to questions table"""
    print("Adding extended_config field to questions table...")

    with engine.connect() as conn:
        try:
            # Add extended_config column
            conn.execute(text("""
                ALTER TABLE questions
                ADD COLUMN IF NOT EXISTS extended_config JSONB
            """))

            conn.commit()

            print("✅ Extended question types migration completed successfully!")
            print("\nAdded column:")
            print("  - extended_config: JSONB")
            print("\nSupported new question types:")
            print("  - mcq_multiple: Multiple correct answers MCQ")
            print("    Format: {\"correct_option_ids\": [\"A\", \"B\"], \"partial_credit\": true}")
            print("  - fill_blank: Fill in the blanks")
            print("    Format: {\"blanks\": [{\"position\": 0, \"correct_answers\": [\"ans1\"], \"points\": 5}]}")
            print("  - multi_part: Multi-part questions")
            print("    Format: {\"sub_questions\": [{\"id\": \"1a\", \"type\": \"mcq\", \"text\": \"...\", ...}]}")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error during migration: {e}")
            raise

def downgrade():
    """Remove extended_config field from questions table"""
    print("Removing extended_config field from questions table...")

    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE questions DROP COLUMN IF EXISTS extended_config"))

            conn.commit()
            print("✅ Extended_config field removed successfully!")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error during rollback: {e}")
            raise

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "down":
        downgrade()
    else:
        upgrade()
