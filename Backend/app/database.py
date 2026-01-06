from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from app.core.config import DATABASE_URL

# Add connection pool settings to handle timeouts and stale connections
# IMPORTANT: Reduced pool size to prevent Supabase connection exhaustion
# In Session Mode, Supabase has strict connection limits
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=3600,   # Recycle connections after 1 hour
    pool_size=3,         # Maximum number of connections to keep in pool (reduced from default 5)
    max_overflow=5,      # Maximum additional connections when pool is full (reduced from default 10)
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()