#!/usr/bin/env python3
"""
Script to add email verification columns to existing users table.
This will NOT delete any existing data.
"""

from app.database import engine
from sqlalchemy import text

print("Adding email verification columns to users table...")
print("This will NOT delete any existing data.\n")

try:
    with engine.connect() as conn:
        # Add is_email_verified column
        try:
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE
            """))
            print("✅ Added is_email_verified column")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️  is_email_verified column already exists")
            else:
                raise

        # Add verification_code column
        try:
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN verification_code VARCHAR(10)
            """))
            print("✅ Added verification_code column")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️  verification_code column already exists")
            else:
                raise

        # Add verification_code_expires column
        try:
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN verification_code_expires TIMESTAMP
            """))
            print("✅ Added verification_code_expires column")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️  verification_code_expires column already exists")
            else:
                raise

        # Add verification_token column
        try:
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN verification_token VARCHAR(255)
            """))
            print("✅ Added verification_token column")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️  verification_token column already exists")
            else:
                raise

        # Add verification_token_expires column
        try:
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN verification_token_expires TIMESTAMP
            """))
            print("✅ Added verification_token_expires column")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️  verification_token_expires column already exists")
            else:
                raise

        conn.commit()

    print("\n🎉 Email verification columns added successfully!")
    print("\nYour existing data is preserved.")
    print("All existing users have is_email_verified = FALSE by default.")
    print("\nYou can now restart your backend server!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nIf you see 'column already exists' errors, that's okay!")
    print("It means the columns were already added.")
