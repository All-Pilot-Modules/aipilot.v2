# this handles 
# 1 cors settings
# 2 Environement Variables
# 3 Logging Rate limiting
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# === Environment Variables ===
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-ada-002")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
INDEX_DIR = os.getenv("INDEX_DIR", "index_store")
PARSED_DOC_DIR = os.getenv("PARSED_DOC_DIR", "parsed_docs")
DATABASE_URL = os.getenv("DATABASE_URL")
ENV = os.getenv("ENV", "development")
JWT_SECRET = os.getenv("JWT_SECRET")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

# === Supabase Configuration ===
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "documents")

# === Email Configuration ===
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", EMAIL_USERNAME)
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "AI Pilot")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# === Environment Variable Validation ===
def validate_required_env_vars():
    """Validate that all required environment variables are set."""
    missing_vars = []

    if not OPENAI_API_KEY:
        missing_vars.append("OPENAI_API_KEY")
    if not DATABASE_URL:
        missing_vars.append("DATABASE_URL")
    if not JWT_SECRET:
        missing_vars.append("JWT_SECRET")
    if not SUPABASE_URL:
        missing_vars.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_KEY:
        missing_vars.append("SUPABASE_SERVICE_KEY")

    if missing_vars:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing_vars)}\n"
            "Please check your .env file and ensure all required variables are set."
        )

# Validate on import
validate_required_env_vars()

# Optional print to confirm it's loaded (for debug)
print("ENV loaded:", ENV)
print("OpenAI Key loaded:", OPENAI_API_KEY[:5] if OPENAI_API_KEY else "NOT SET", "...")

# === CORS Setup ===
def add_cors(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Use domain in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
# making env nicer