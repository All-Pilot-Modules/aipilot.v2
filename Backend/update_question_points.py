"""
Quick script to update existing questions with default points value.
Run this once to add points to questions created before the points system.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def update_question_points():
    """Set points=1.0 for any questions that don't have points set"""
    print("Updating existing questions with default points...")

    with engine.connect() as conn:
        try:
            # Check if points column exists
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='questions' AND column_name='points'
            """))

            if not result.fetchone():
                print("❌ Points column doesn't exist in questions table.")
                print("Please run the migration first:")
                print("  python migrations/add_points_and_rubric_enforcement.py")
                return

            # Update any questions where points is NULL
            result = conn.execute(text("""
                UPDATE questions
                SET points = 1.0
                WHERE points IS NULL
            """))

            rows_updated = result.rowcount
            conn.commit()

            print(f"✅ Updated {rows_updated} question(s) with default points (1.0)")

            # Show current state
            result = conn.execute(text("""
                SELECT COUNT(*) as total,
                       MIN(points) as min_points,
                       MAX(points) as max_points
                FROM questions
            """))
            stats = result.fetchone()

            print(f"\nQuestion Statistics:")
            print(f"  Total questions: {stats[0]}")
            print(f"  Min points: {stats[1]}")
            print(f"  Max points: {stats[2]}")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error: {e}")
            raise

if __name__ == "__main__":
    update_question_points()
