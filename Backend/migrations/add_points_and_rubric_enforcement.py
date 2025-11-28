"""
Migration script to add point-based grading and rubric enforcement.

This migration adds:
1. Points field to questions table
2. Score tracking fields to test_submissions table
3. Rubric enforcement fields to ai_feedback table
4. New teacher_grades table for manual grading

Usage:
    python migrations/add_points_and_rubric_enforcement.py
    python migrations/add_points_and_rubric_enforcement.py down  # to rollback
"""

import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def upgrade():
    """Add points-based grading and rubric enforcement features"""
    print("Starting points and rubric enforcement migration...")

    with engine.connect() as conn:
        try:
            # 1. Add points to questions table
            print("\n1. Adding points field to questions table...")
            conn.execute(text("""
                ALTER TABLE questions
                ADD COLUMN IF NOT EXISTS points FLOAT DEFAULT 1.0 NOT NULL
            """))
            print("   ✅ Added points column (default: 1.0)")

            # 2. Add score tracking to test_submissions
            print("\n2. Adding score tracking to test_submissions table...")
            conn.execute(text("""
                ALTER TABLE test_submissions
                ADD COLUMN IF NOT EXISTS total_points_possible FLOAT,
                ADD COLUMN IF NOT EXISTS total_points_earned FLOAT,
                ADD COLUMN IF NOT EXISTS percentage_score FLOAT
            """))
            print("   ✅ Added total_points_possible, total_points_earned, percentage_score")

            # 3. Add rubric fields to ai_feedback
            print("\n3. Adding rubric enforcement fields to ai_feedback table...")
            conn.execute(text("""
                ALTER TABLE ai_feedback
                ADD COLUMN IF NOT EXISTS points_earned FLOAT,
                ADD COLUMN IF NOT EXISTS points_possible FLOAT,
                ADD COLUMN IF NOT EXISTS criterion_scores JSONB,
                ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20)
            """))
            print("   ✅ Added points_earned, points_possible, criterion_scores, confidence_level")

            # 4. Create teacher_grades table
            print("\n4. Creating teacher_grades table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS teacher_grades (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    answer_id UUID NOT NULL UNIQUE REFERENCES student_answers(id) ON DELETE CASCADE,
                    student_id VARCHAR NOT NULL,
                    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                    points_awarded FLOAT NOT NULL,
                    feedback_text TEXT,
                    criterion_scores JSONB,
                    ai_suggested_score FLOAT,
                    overridden_ai BOOLEAN DEFAULT FALSE,
                    graded_by UUID NOT NULL REFERENCES users(id),
                    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                )
            """))
            print("   ✅ Created teacher_grades table")

            # 5. Create indexes for teacher_grades
            print("\n5. Creating indexes for teacher_grades...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_teacher_grades_answer_id
                ON teacher_grades(answer_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_teacher_grades_student_module
                ON teacher_grades(student_id, module_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_teacher_grades_graded_by
                ON teacher_grades(graded_by)
            """))
            print("   ✅ Created indexes on teacher_grades")

            conn.commit()

            print("\n" + "="*60)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("="*60)
            print("\nNew Features Added:")
            print("  📊 Point-based grading system")
            print("  📝 Per-criterion rubric scoring")
            print("  🎯 Confidence level tracking")
            print("  👨‍🏫 Teacher manual grading interface")
            print("\nDatabase Changes:")
            print("  • questions.points (Float, default: 1.0)")
            print("  • test_submissions.total_points_*")
            print("  • ai_feedback.points_*, criterion_scores, confidence_level")
            print("  • teacher_grades (new table)")
            print("\nNext Steps:")
            print("  1. Restart your backend server")
            print("  2. Existing questions will default to 1 point each")
            print("  3. Teachers can now assign custom points per question")
            print("  4. AI will provide per-criterion score breakdowns")
            print("="*60)

        except Exception as e:
            conn.rollback()
            print(f"\n❌ Error during migration: {e}")
            print("Rolling back changes...")
            raise

def downgrade():
    """Remove points-based grading and rubric enforcement features"""
    print("Rolling back points and rubric enforcement migration...")

    with engine.connect() as conn:
        try:
            # 1. Drop teacher_grades table
            print("\n1. Dropping teacher_grades table...")
            conn.execute(text("DROP TABLE IF EXISTS teacher_grades CASCADE"))
            print("   ✅ Dropped teacher_grades table")

            # 2. Remove fields from ai_feedback
            print("\n2. Removing rubric fields from ai_feedback...")
            conn.execute(text("""
                ALTER TABLE ai_feedback
                DROP COLUMN IF EXISTS points_earned,
                DROP COLUMN IF EXISTS points_possible,
                DROP COLUMN IF EXISTS criterion_scores,
                DROP COLUMN IF EXISTS confidence_level
            """))
            print("   ✅ Removed rubric fields from ai_feedback")

            # 3. Remove fields from test_submissions
            print("\n3. Removing score tracking from test_submissions...")
            conn.execute(text("""
                ALTER TABLE test_submissions
                DROP COLUMN IF EXISTS total_points_possible,
                DROP COLUMN IF EXISTS total_points_earned,
                DROP COLUMN IF EXISTS percentage_score
            """))
            print("   ✅ Removed score tracking from test_submissions")

            # 4. Remove points from questions
            print("\n4. Removing points from questions...")
            conn.execute(text("ALTER TABLE questions DROP COLUMN IF EXISTS points"))
            print("   ✅ Removed points from questions")

            conn.commit()

            print("\n✅ Rollback completed successfully!")
            print("All point-based grading features have been removed.")

        except Exception as e:
            conn.rollback()
            print(f"\n❌ Error during rollback: {e}")
            raise

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "down":
        downgrade()
    else:
        upgrade()
