"""
Migration script to add status tracking columns to ai_feedback table.

This enables real-time feedback generation monitoring, error handling, and retry logic.

IMPORTANT: This migration is SAFE for existing data!
- All new columns have safe defaults
- Existing feedback will be marked as 'completed' with 100% progress
- feedback_data will remain intact

Usage:
    # Activate venv first!
    source venv/bin/activate

    # Run migration
    python migrations/add_feedback_status_tracking.py

    # Rollback (if needed)
    python migrations/add_feedback_status_tracking.py down
"""

import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models.ai_feedback import AIFeedback

def upgrade():
    """Add status tracking columns to ai_feedback table"""
    print("=" * 70)
    print("🔄 Adding status tracking to ai_feedback table...")
    print("=" * 70)

    db = SessionLocal()

    try:
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'ai_feedback'
            AND column_name = 'generation_status'
        """))

        if result.fetchone():
            print("⚠️  Columns already exist! Migration already run.")
            return

        print("\n📝 Step 1: Making feedback_data nullable...")
        db.execute(text("""
            ALTER TABLE ai_feedback
            ALTER COLUMN feedback_data DROP NOT NULL
        """))
        db.commit()
        print("✅ feedback_data is now nullable")

        print("\n📝 Step 2: Adding status tracking columns...")

        # Generation status tracking
        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN generation_status VARCHAR(20) NOT NULL DEFAULT 'completed'
        """))

        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN generation_progress INTEGER NOT NULL DEFAULT 100
        """))

        # Error tracking
        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN error_message VARCHAR(255)
        """))

        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN error_type VARCHAR(50)
        """))

        # Retry management
        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0
        """))

        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3
        """))

        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN can_retry BOOLEAN NOT NULL DEFAULT FALSE
        """))

        # Timeout configuration
        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN timeout_seconds INTEGER NOT NULL DEFAULT 120
        """))

        # Performance tracking
        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN generation_duration INTEGER
        """))

        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN ai_model_used VARCHAR(50)
        """))

        # Timestamps
        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN started_at TIMESTAMP
        """))

        db.execute(text("""
            ALTER TABLE ai_feedback
            ADD COLUMN completed_at TIMESTAMP
        """))

        db.commit()
        print("✅ All columns added successfully")

        print("\n📝 Step 3: Creating index for faster queries...")
        db.execute(text("""
            CREATE INDEX ix_ai_feedback_generation_status
            ON ai_feedback(generation_status)
        """))
        db.commit()
        print("✅ Index created")

        print("\n📝 Step 4: Setting timestamps for existing rows...")
        db.execute(text("""
            UPDATE ai_feedback
            SET completed_at = generated_at,
                started_at = generated_at
            WHERE completed_at IS NULL
            AND generation_status = 'completed'
        """))
        db.commit()
        print("✅ Timestamps updated for existing feedback")

        # Count rows
        result = db.execute(text("SELECT COUNT(*) FROM ai_feedback"))
        count = result.scalar()

        print("\n" + "=" * 70)
        print("✅ Migration completed successfully!")
        print("=" * 70)
        print(f"📊 {count} existing feedback rows marked as 'completed' (100%)")
        print("\n📋 New columns added:")
        print("  • generation_status - Track feedback generation state")
        print("  • generation_progress - Progress percentage (0-100)")
        print("  • error_message - Error description if failed")
        print("  • error_type - Type of error (timeout, api_error, etc.)")
        print("  • retry_count - Number of retry attempts")
        print("  • can_retry - Whether retry is allowed")
        print("  • timeout_seconds - Timeout configuration")
        print("  • generation_duration - Time taken to generate")
        print("  • ai_model_used - Which AI model was used")
        print("  • started_at - When generation started")
        print("  • completed_at - When generation completed/failed")
        print("\n🔄 New features enabled:")
        print("  ✅ Real-time progress tracking")
        print("  ✅ Automatic timeout detection")
        print("  ✅ Retry on failures")
        print("  ✅ Error visibility for debugging")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        print("\nIf columns already exist, this is expected. Check with:")
        print("  SELECT column_name FROM information_schema.columns")
        print("  WHERE table_name = 'ai_feedback';")
        raise
    finally:
        db.close()

def downgrade():
    """Remove status tracking columns (rollback)"""
    print("=" * 70)
    print("⚠️  Rolling back status tracking migration...")
    print("=" * 70)

    db = SessionLocal()

    try:
        print("\n📝 Dropping index...")
        db.execute(text("""
            DROP INDEX IF EXISTS ix_ai_feedback_generation_status
        """))

        print("\n📝 Removing new columns...")
        columns_to_drop = [
            'completed_at',
            'started_at',
            'ai_model_used',
            'generation_duration',
            'timeout_seconds',
            'can_retry',
            'max_retries',
            'retry_count',
            'error_type',
            'error_message',
            'generation_progress',
            'generation_status'
        ]

        for column in columns_to_drop:
            try:
                db.execute(text(f"ALTER TABLE ai_feedback DROP COLUMN {column}"))
                print(f"  ✅ Dropped {column}")
            except Exception as e:
                print(f"  ⚠️  Could not drop {column}: {e}")

        print("\n📝 Restoring feedback_data NOT NULL constraint...")
        db.execute(text("""
            UPDATE ai_feedback SET feedback_data = '{}'::jsonb
            WHERE feedback_data IS NULL
        """))
        db.execute(text("""
            ALTER TABLE ai_feedback
            ALTER COLUMN feedback_data SET NOT NULL
        """))

        db.commit()

        print("\n" + "=" * 70)
        print("✅ Rollback completed successfully!")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Rollback failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "down":
        downgrade()
    else:
        upgrade()
