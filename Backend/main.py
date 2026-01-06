

from fastapi import FastAPI
from typing import Union
import logging
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(name)s - %(message)s'
)

# 🚦 Import API routers
from app.api.routes.test import router as test_router
from app.api.routes.user import router as user_router
from app.api.routes.auth import router as auth_router
from app.api.routes.document import router as document_router
from app.api.routes.question import router as question_router
from app.api.routes.module import router as module_router
from app.api.routes.student import router as student_router
from app.api.routes.student_answers import router as student_answers_router
from app.api.routes.chat import router as chat_router
from app.api.routes.survey import router as survey_router
from app.api.routes.export import router as export_router
from app.api.routes.feedback import router as feedback_router

from app.core.config import add_cors
from app.database import engine
from app.models import Base


# Middleware to handle X-Forwarded-Proto from Google Cloud Run
class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Trust proxy headers from Google Cloud Run
        forwarded_proto = request.headers.get("X-Forwarded-Proto")
        if forwarded_proto:
            request.scope["scheme"] = forwarded_proto

        response = await call_next(request)
        return response


app = FastAPI()

# 🔒 Add proxy headers middleware FIRST (before CORS)
app.add_middleware(ProxyHeadersMiddleware)

# 🚦 Apply CORS settings
add_cors(app)

# 🔌 Register API routes
app.include_router(test_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(document_router, prefix="/api", tags=["Documents"])
app.include_router(question_router, prefix="/api", tags=["Questions"])
app.include_router(module_router, prefix="/api", tags=["module"])
app.include_router(student_router, prefix="/api/student", tags=["Student"])
app.include_router(student_answers_router, prefix="/api/student-answers", tags=["Student Answers"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(survey_router, prefix="/api", tags=["Survey"])
app.include_router(export_router, prefix="/api", tags=["Export"])
app.include_router(feedback_router, prefix="/api/ai-feedback", tags=["AI Feedback"])

# 🚀 Startup event to create all tables and import all models
@app.on_event("startup")
def on_startup():
    print("🚀 App startup initiated...")

    # ✅ Validate environment variables before proceeding
    from app.core.config import validate_required_env_vars
    try:
        validate_required_env_vars()
        print("✅ All required environment variables are set")
    except ValueError as e:
        print(f"\n{'='*80}")
        print(f"⚠️  STARTUP ERROR: Environment Variables Missing")
        print(f"{'='*80}")
        print(str(e))
        print(f"{'='*80}\n")
        # Re-raise to prevent app from starting with missing config
        raise

    # ✅ Ensure all models are imported for table creation
    from app.models import user, document, question, module, student_answer, student_enrollment, survey_response, question_queue, document_chunk, document_embedding, ai_feedback, chat_conversation, chat_message
    print("📊 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully (including student_enrollments, survey_responses, ai_feedback and chat tables)")
    print("🎉 Application startup complete!")

# 📎 Test route
@app.get("/")
def read_root():
    return {"Hello": "World"}

# 📎 Sample item route
@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}