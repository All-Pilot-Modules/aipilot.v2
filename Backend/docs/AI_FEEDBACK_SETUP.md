# AI Feedback Database - Quick Setup

## ✅ Automatic Table Creation

The `ai_feedback` table is automatically created when you start the backend!

## How to Activate

**Simply restart your backend server:**

```bash
# Stop current backend (Ctrl+C if running)

# Start backend
cd Backend
uvicorn main:app --reload
```

## What Happens

When the backend starts, you'll see:

```
🚀 App started! Creating tables...
✅ All tables created successfully (including ai_feedback table)
```

## What's Stored

Every time AI generates feedback, it's now saved to the database with:

- ✅ **Student ID** - Which student
- ✅ **Module ID** - Which module
- ✅ **Question ID** - Which question
- ✅ **Attempt** - Attempt 1 or 2
- ✅ **Score** - Correctness score (0-100)
- ✅ **Feedback** - All AI-generated content
- ✅ **RAG Sources** - Which documents were referenced
- ✅ **Timestamps** - When feedback was generated
- ✅ **Token Usage** - For cost tracking

## Benefits

1. **No Regeneration** - Feedback generated once, retrieved instantly
2. **Cost Savings** - No duplicate OpenAI API calls
3. **Fast Queries** - Database lookups in milliseconds
4. **Complete History** - Audit trail of all feedback
5. **Analytics Ready** - Can analyze feedback quality, scores, etc.

## New API Endpoints

Once you restart the backend, these endpoints are available:

```
GET /api/student/modules/{module_id}/feedback?student_id=xxx
GET /api/student/questions/{question_id}/feedback?student_id=xxx&attempt=1
```

## Verification

To verify the table was created:

```sql
-- Check table exists
SELECT * FROM ai_feedback LIMIT 1;

-- See all feedback
SELECT student_id, question_id, attempt, correctness_score, generated_at
FROM ai_feedback
ORDER BY generated_at DESC;
```

## That's It!

No manual steps needed. Just restart your backend and the system is live! 🎉

For detailed documentation, see: `AI_FEEDBACK_PERSISTENCE.md`
