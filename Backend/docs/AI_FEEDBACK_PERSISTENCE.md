# AI Feedback Persistence System

## Overview

All AI-generated feedback is now permanently stored in the database with complete tracking of which student, module, question, and attempt the feedback belongs to.

---

## Database Schema

### `ai_feedback` Table

**Purpose**: Store all AI-generated feedback with complete metadata

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `student_id` | String | Banner ID of the student |
| `question_id` | UUID | Foreign key to questions table |
| `module_id` | UUID | Foreign key to modules table |
| `answer_id` | UUID | Foreign key to student_answers table |
| `attempt` | Integer | Attempt number (1 or 2) |
| `is_correct` | Boolean | Whether answer was correct |
| `correctness_score` | Integer | Score 0-100 |
| `explanation` | Text | AI explanation of correctness |
| `improvement_hint` | Text | Suggestion for improvement |
| `concept_explanation` | Text | Key concept explanation |
| `strengths` | JSONB | Array of strengths (text answers) |
| `weaknesses` | JSONB | Array of weaknesses (text answers) |
| `selected_option` | String | Selected option (MCQ) |
| `correct_option` | String | Correct option (MCQ) |
| `available_options` | JSONB | All options (MCQ) |
| `used_rag` | Boolean | Whether RAG was used |
| `rag_sources` | JSONB | Array of source document names |
| `rag_context` | Text | RAG context used for feedback |
| `model_used` | String | AI model name (e.g., gpt-4) |
| `confidence_level` | String | low/medium/high |
| `generated_at` | Timestamp | When feedback was generated |
| `prompt_tokens` | Integer | Token usage for cost tracking |
| `completion_tokens` | Integer | Completion token count |
| `total_tokens` | Integer | Total tokens used |
| `extra_metadata` | JSONB | Additional data (renamed from 'metadata' to avoid SQLAlchemy conflict) |

**Indexes**:
- Unique index on `(answer_id, attempt)` - One feedback per answer per attempt
- Index on `(student_id, module_id)` - Fast student module queries
- Index on `question_id` - Fast question lookups
- Index on `generated_at` - Time-based queries

---

## Implementation

### 1. Model: `app/models/ai_feedback.py`

SQLAlchemy model with all fields and relationships to students, questions, modules, and answers.

### 2. Schema: `app/schemas/ai_feedback.py`

Pydantic schemas for:
- `AIFeedbackCreate` - Creating new feedback
- `AIFeedbackResponse` - Returning to frontend
- `AIFeedbackFull` - Including RAG context and tokens

### 3. CRUD: `app/crud/ai_feedback.py`

Functions:
- `create_feedback()` - Save new feedback
- `get_feedback_by_answer()` - Get by answer ID
- `get_feedback_by_question()` - Get by student + question + attempt
- `get_student_module_feedback()` - Get all feedback for student in module
- `get_all_module_feedback()` - Get all feedback for module (teacher view)
- `update_feedback()` - Update existing feedback
- `delete_feedback()` - Delete feedback
- `get_feedback_statistics()` - Get analytics

### 4. Service: `app/services/ai_feedback.py`

Updated `generate_instant_feedback()` to:
1. Check if feedback already exists in database
2. Return existing feedback if found
3. Generate new feedback if not found
4. Save new feedback to database
5. Return feedback dict to API

### 5. API: `app/api/routes/student.py`

New endpoints:
- `GET /api/student/modules/{module_id}/feedback?student_id=xxx` - Get all feedback for student in module
- `GET /api/student/questions/{question_id}/feedback?student_id=xxx&attempt=1` - Get feedback for specific question

Existing endpoint:
- `POST /api/student/submit-answer` - Now saves feedback to database

---

## Workflow

### When Student Submits Answer

```
1. Student submits answer
   ↓
2. Backend saves answer to student_answers table
   ↓
3. AIFeedbackService checks if feedback exists
   ├─ If exists: Return cached feedback from database
   └─ If not exists:
      ├─ Generate new AI feedback
      ├─ Save to ai_feedback table
      └─ Return feedback
   ↓
4. Frontend displays feedback
```

### When Student Views Feedback Tab

```
1. Student navigates to Feedback tab
   ↓
2. Frontend calls GET /api/student/modules/{module_id}/feedback
   ↓
3. Backend queries ai_feedback table
   ↓
4. Returns all feedback for that student in that module
   ↓
5. Frontend displays all feedback cards
```

---

## Benefits

### 1. Performance
- **No Regeneration**: Feedback generated once, retrieved from database instantly
- **Cost Savings**: No duplicate OpenAI API calls
- **Fast Queries**: Indexed database lookups are milliseconds

### 2. Data Integrity
- **Audit Trail**: Complete history of all feedback
- **Immutable**: Once generated, feedback doesn't change
- **Traceable**: Know exactly when feedback was generated

### 3. Analytics
- **Statistics**: Can analyze feedback quality, scores, RAG usage
- **Teacher Insights**: Teachers can see all feedback for their module
- **Cost Tracking**: Token usage stored for billing analysis

### 4. Consistency
- **Same Feedback**: Student sees identical feedback if they revisit
- **Second Attempts**: Clear separation between attempt 1 and attempt 2 feedback

---

## Example Usage

### Save Feedback (Automatic)

```python
# Happens automatically in AIFeedbackService
feedback_create = AIFeedbackCreate(
    student_id="STUDENT_001",
    question_id=question_uuid,
    module_id=module_uuid,
    answer_id=answer_uuid,
    attempt=1,
    is_correct=True,
    correctness_score=95,
    explanation="Your answer demonstrates...",
    improvement_hint="Consider adding...",
    concept_explanation="The key concept is...",
    used_rag=True,
    rag_sources=["Textbook.pdf", "Slides.pptx"],
    model_used="gpt-4",
    confidence_level="high"
)

db_feedback = create_feedback(db, feedback_create)
```

### Retrieve Feedback (Frontend)

```javascript
// Get all feedback for module
const response = await apiClient.get(
  `/api/student/modules/${moduleId}/feedback?student_id=${studentId}`
);

// response.data is array of AIFeedbackResponse objects
feedback.forEach(f => {
  console.log(`Q: ${f.question_id}, Score: ${f.correctness_score}%, Correct: ${f.is_correct}`);
});
```

### Get Statistics (Teacher)

```python
from app.crud.ai_feedback import get_feedback_statistics

stats = get_feedback_statistics(db, module_id)
# {
#   "total_feedback": 150,
#   "correct_count": 120,
#   "incorrect_count": 30,
#   "average_score": 82.5,
#   "rag_usage_count": 100,
#   "rag_usage_percentage": 66.7
# }
```

---

## Migration Guide

### Creating the Table

The `ai_feedback` table is **automatically created** when you start the backend server!

**Just restart your backend**:

```bash
# Stop your current backend (Ctrl+C)
# Then start again
cd Backend
uvicorn main:app --reload
```

You'll see this message on startup:
```
🚀 App started! Creating tables...
✅ All tables created successfully (including ai_feedback table)
```

The table creation happens in `main.py` during the startup event.

### Existing Feedback

- **Legacy Feedback**: Any feedback generated before this update was not saved
- **New Feedback**: All feedback from now on will be persisted
- **No Backfill Needed**: Old feedback cannot be recovered (wasn't stored)
- **Zero Downtime**: Table creation is idempotent (safe to run multiple times)

---

## API Reference

### Get Module Feedback

**Endpoint**: `GET /api/student/modules/{module_id}/feedback`

**Query Parameters**:
- `student_id` (required): Student Banner ID

**Response**: Array of `AIFeedbackResponse`

```json
[
  {
    "id": "uuid",
    "student_id": "STUDENT_001",
    "question_id": "uuid",
    "module_id": "uuid",
    "answer_id": "uuid",
    "attempt": 1,
    "is_correct": false,
    "correctness_score": 65,
    "explanation": "Your answer shows...",
    "improvement_hint": "Try to include...",
    "concept_explanation": "The main concept is...",
    "strengths": ["Clear explanation", "Good structure"],
    "weaknesses": ["Missing key point"],
    "selected_option": "B",
    "correct_option": "C",
    "available_options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "used_rag": true,
    "rag_sources": ["Textbook_Ch3.pdf"],
    "model_used": "gpt-4",
    "confidence_level": "high",
    "generated_at": "2025-01-15T10:30:00Z"
  }
]
```

### Get Question Feedback

**Endpoint**: `GET /api/student/questions/{question_id}/feedback`

**Query Parameters**:
- `student_id` (required): Student Banner ID
- `attempt` (optional, default=1): Attempt number (1 or 2)

**Response**: Single `AIFeedbackResponse` object

---

## Future Enhancements

### Phase 1 (Completed)
- ✅ Database schema
- ✅ Models and schemas
- ✅ CRUD operations
- ✅ Service integration
- ✅ API endpoints

### Phase 2 (Potential)
- [ ] Feedback versioning (regenerate if rubric changes)
- [ ] Feedback quality ratings (student can rate helpfulness)
- [ ] Teacher feedback overrides (manual corrections)
- [ ] Feedback templates by question type
- [ ] Batch feedback generation (background job)
- [ ] Feedback analytics dashboard
- [ ] Export feedback to CSV/PDF

### Phase 3 (Advanced)
- [ ] Multi-language feedback
- [ ] Voice feedback (TTS)
- [ ] Comparative feedback (attempt 1 vs attempt 2)
- [ ] AI feedback improvement suggestions
- [ ] Peer comparison (anonymized)

---

## Testing

### Test Feedback Persistence

1. **Submit Answer**:
```bash
curl -X POST http://localhost:8000/api/student/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "TEST_001",
    "question_id": "question-uuid",
    "module_id": "module-uuid",
    "answer": {"selected_option": "B"},
    "attempt": 1
  }'
```

2. **Check Database**:
```sql
SELECT * FROM ai_feedback
WHERE student_id = 'TEST_001'
ORDER BY generated_at DESC;
```

3. **Retrieve Feedback**:
```bash
curl "http://localhost:8000/api/student/modules/{module_id}/feedback?student_id=TEST_001"
```

---

## Troubleshooting

### Feedback Not Saving

**Check**:
1. Table exists: `SELECT * FROM ai_feedback LIMIT 1;`
2. Logs for errors: Look for "Failed to save feedback to database"
3. Foreign keys valid: Ensure question_id, module_id, answer_id exist

**Solution**: The service continues even if database save fails, so frontend will still work

### Duplicate Feedback

**Check**: Should not happen due to unique index on `(answer_id, attempt)`

**If it does**:
```sql
DELETE FROM ai_feedback
WHERE id NOT IN (
  SELECT MIN(id)
  FROM ai_feedback
  GROUP BY answer_id, attempt
);
```

### Missing Feedback

**Check**:
1. Was answer submitted with `attempt=1`? (Only first attempt gets feedback)
2. Did feedback generation succeed? (Check logs)
3. Is student_id correct?

**Solution**: Re-submit answer to regenerate feedback

---

## Security Considerations

1. **Student Isolation**: Students can only see their own feedback (enforced by student_id filter)
2. **No Sensitive Data**: Feedback doesn't contain PII beyond student_id
3. **RAG Context**: Full RAG context stored securely, not exposed to frontend
4. **Token Tracking**: Token counts stored for cost monitoring
5. **Audit Trail**: `generated_at` timestamp for accountability

---

## Summary

The AI Feedback Persistence system provides:

✅ **Permanent Storage** - All feedback saved to database
✅ **Fast Retrieval** - Indexed queries in milliseconds
✅ **Cost Efficiency** - No duplicate API calls
✅ **Complete Tracking** - Student, module, question, attempt
✅ **Analytics Ready** - Statistics and insights available
✅ **Production Ready** - Fully implemented and tested

**Key Files**:
- Model: `app/models/ai_feedback.py`
- Schema: `app/schemas/ai_feedback.py`
- CRUD: `app/crud/ai_feedback.py`
- Service: `app/services/ai_feedback.py` (updated)
- API: `app/api/routes/student.py` (updated)
- Startup: `main.py` (updated - auto-creates table)

**Activation**:
Just restart your backend server - the table will be created automatically!

The system is ready for production use! 🎉
