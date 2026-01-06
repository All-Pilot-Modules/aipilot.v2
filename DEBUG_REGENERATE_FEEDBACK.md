# Debug Guide: Regenerate Feedback Not Working

## Problem
You click "Regenerate All Feedback" but nothing happens - no logs, no OpenAI calls.

## Step 1: Check Your Database Directly

Run this script to see what feedback records exist and their status:

```bash
cd Backend
python3 debug_feedback_status.py <module_id> <student_id> <attempt>
```

**How to get these values:**
1. **module_id**: UUID of the module (check URL or database)
2. **student_id**: The student's ID (check URL or database)
3. **attempt**: Usually 1 for first attempt

**Example:**
```bash
python3 debug_feedback_status.py 123e4567-e89b-12d3-a456-426614174000 student123 1
```

This will show:
- How many answers exist
- Each answer's feedback status
- Which feedback records are NULL/incomplete
- Which answers SHOULD be retried
- Exact reason WHY each should be retried

## Step 2: Check Server Logs

When you click "Regenerate All Feedback", you should see logs like:

```
🔄 ============ BULK RETRY REQUESTED ============
🔄 Module: <module_id>, Student: <student_id>, Attempt: 1
📊 Found 10 total answers for this attempt
🔍 Checking each answer for failed/incomplete feedback...
📝 [1/10] Answer <id>: feedback_exists=True, status=completed, data_exists=False
🔧 Including answer <id> - feedback_data is NULL
...
🚀 ============ RETRYING 5 FAILED QUESTIONS ============
🚀 Answer IDs to retry: ['<id1>', '<id2>', ...]
🎯 Adding background task: generate_feedback_background(...)
✅ Background task added successfully!
```

**If you DON'T see these logs:**
- The frontend is NOT calling the endpoint correctly
- Check the frontend code
- Check browser console for errors
- Verify the API path is `/api/ai-feedback/retry/module/{module_id}` (NOT `/api/feedback/...`)

**If you see "NO FAILED FEEDBACK FOUND":**
- The detection logic isn't finding your NULL feedback
- Run the debug script (Step 1) to see what the database actually has
- Share the output with me

## Step 3: Check Frontend Is Calling Correct Endpoint

Open browser DevTools (F12) → Network tab → Click "Regenerate All Feedback"

You should see a POST request to:
```
POST /api/ai-feedback/retry/module/{module_id}?student_id=xxx&attempt=1
```

**NOT:**
```
POST /api/feedback/retry/module/{module_id}  ← WRONG!
```

If it's calling the wrong path, the backend router won't find it!

## Step 4: Verify Backend Is Running

Make sure your FastAPI server is running with proper logging:

```bash
cd Backend
# Check if server is running
ps aux | grep uvicorn

# If not running, start it:
uvicorn main:app --reload --log-level info
```

You should see startup logs including:
```
INFO:     Started server process
INFO:     Waiting for application startup.
```

## Step 5: Manual API Test

Test the endpoint directly with curl:

```bash
curl -X POST "http://localhost:8000/api/ai-feedback/retry/module/<MODULE_ID>?student_id=<STUDENT_ID>&attempt=1" \
  -H "Content-Type: application/json"
```

Replace:
- `<MODULE_ID>` with your module UUID
- `<STUDENT_ID>` with student ID

You should get a JSON response:
```json
{
  "success": true,
  "message": "Regenerating feedback for X question(s)...",
  "answers_retried": 5,
  "answer_ids": ["...", "..."]
}
```

## Common Issues

### 1. "No failed feedback found" but you KNOW there are failed ones
**Cause:** The feedback records have `generation_status='completed'` (from server default) but `feedback_data=NULL`

**Fix:** Already implemented! The new logic checks:
- `feedback_data is None`
- `score is None AND is_correct is None`
- Missing essential fields

**Debug:** Run `python3 debug_feedback_status.py` to see exact database state

### 2. Frontend returns error "Module not found"
**Cause:** Wrong module_id or student doesn't have answers

**Fix:** Check database:
```sql
SELECT * FROM student_answers WHERE module_id = '<MODULE_ID>' AND student_id = '<STUDENT_ID>';
```

### 3. No logs appear at all
**Cause:** Server not running or wrong log level

**Fix:**
```bash
# Kill existing server
pkill -f uvicorn

# Restart with verbose logging
cd Backend
uvicorn main:app --reload --log-level debug
```

### 4. Frontend calls wrong endpoint
**Cause:** Frontend still using old `/api/feedback/` path

**Fix:** Check these files:
- `Frontend/app/student/module/[moduleId]/page.js` → Should use `/api/ai-feedback/retry/module/`
- `Frontend/hooks/useFeedbackPolling.js` → Should use `/api/ai-feedback/status/answer/`

## Next Steps

1. **First**, run the debug script and share output
2. **Second**, check server logs when clicking button
3. **Third**, check browser Network tab for API calls

This will tell us exactly where it's failing!
