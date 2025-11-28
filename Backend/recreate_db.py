#!/usr/bin/env python3
"""
Script to drop and recreate database tables with new schema.
This will DELETE all existing data!
"""

from app.database import engine, Base
from app.models.user import User

# Import all other models to ensure they're registered
try:
    from app.models.module import Module
except:
    pass
try:
    from app.models.test_submission import TestSubmission
except:
    pass

print("⚠️  WARNING: This will DELETE all data in the database!")
print("Dropping all tables...")

# Drop all tables
Base.metadata.drop_all(engine)
print("✅ All tables dropped")

print("\nCreating tables with new schema...")

# Create all tables with new schema
Base.metadata.create_all(engine)
print("✅ All tables created with new schema")

print("\n🎉 Database recreation complete!")
print("\nNew User table now includes:")
print("  - is_email_verified (BOOLEAN)")
print("  - verification_code (VARCHAR)")
print("  - verification_code_expires (TIMESTAMP)")
print("  - verification_token (VARCHAR)")
print("  - verification_token_expires (TIMESTAMP)")
