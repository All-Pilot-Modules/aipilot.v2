"""
Migration script to add email verification fields to users table.
Run this to enable email verification functionality.

Usage:
    python migrations/add_email_verification_fields.py
    python migrations/add_email_verification_fields.py down  # to rollback
"""

import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def upgrade():
    """Add email verification fields to users table"""
    print("Adding email verification fields to users table...")

    with engine.connect() as conn:
        try:
            # Add is_email_verified column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE
            """))

            # Add verification_code column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)
            """))

            # Add verification_code_expires column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP
            """))

            # Add verification_token column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)
            """))

            # Add verification_token_expires column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP
            """))

            conn.commit()

            print("✅ Email verification fields added successfully!")
            print("\nAdded columns:")
            print("  - is_email_verified: BOOLEAN (default: FALSE)")
            print("  - verification_code: VARCHAR(10)")
            print("  - verification_code_expires: TIMESTAMP")
            print("  - verification_token: VARCHAR(255)")
            print("  - verification_token_expires: TIMESTAMP")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error during migration: {e}")
            raise

def downgrade():
    """Remove email verification fields from users table"""
    print("Removing email verification fields from users table...")

    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS is_email_verified"))
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS verification_code"))
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS verification_code_expires"))
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS verification_token"))
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS verification_token_expires"))

            conn.commit()
            print("✅ Email verification fields removed successfully!")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error during rollback: {e}")
            raise

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "down":
        downgrade()
    else:
        upgrade()
