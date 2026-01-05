# 🚀 How to Run the Feedback Status Migration

## ✅ Step-by-Step Instructions

### **1. Activate Virtual Environment**
```bash
cd /Users/yubraj/Developer/Coding/surmm/aipilot.v2/Backend

# Activate venv
source venv/bin/activate
```

### **2. Install Required Package (tenacity already in requirements.txt)**
```bash
# Tenacity is already in your requirements.txt, but make sure it's installed:
pip install tenacity
```

### **3. Run the Migration**
```bash
# Run the migration script
python migrations/add_feedback_status_tracking.py
```

### **4. Verify It Worked**
You should see output like:
```
======================================================================
🔄 Adding status tracking to ai_feedback table...
======================================================================

📝 Step 1: Making feedback_data nullable...
✅ feedback_data is now nullable

📝 Step 2: Adding status tracking columns...
✅ All columns added successfully

📝 Step 3: Creating index for faster queries...
✅ Index created

📝 Step 4: Setting timestamps for existing rows...
✅ Timestamps updated for existing feedback

======================================================================
✅ Migration completed successfully!
======================================================================
📊 XXX existing feedback rows marked as 'completed' (100%)
```

### **5. Restart Your Backend**
```bash
# Stop your current backend (Ctrl+C if running)

# Start again
uvicorn main:app --reload
```

---

## 🔍 Verify in Database (Optional)

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_feedback'
AND column_name IN ('generation_status', 'generation_progress', 'error_message');

-- Check existing feedback
SELECT
    id,
    generation_status,
    generation_progress,
    completed_at
FROM ai_feedback
LIMIT 5;
```

---

## 🔄 If You Need to Rollback

```bash
python migrations/add_feedback_status_tracking.py down
```

---

## ⚠️ Troubleshooting

### Error: "relation already exists" or "column already exists"
**Solution:** Migration already ran! You're good to go.

### Error: "column feedback_data must have a default value"
**Solution:** The migration handles this by making it nullable first.

### Error: "permission denied"
**Solution:** Make sure your database user has ALTER TABLE permissions.

---

## ✅ What Happens to Existing Data?

- **SAFE:** All existing feedback rows are preserved
- **SAFE:** All existing `feedback_data` content stays intact
- **SAFE:** Existing rows marked as `status='completed'`, `progress=100`
- **SAFE:** Timestamps set to match `generated_at` for existing rows
- **SAFE:** No data loss - migration only ADDS columns

---

## 🎯 Ready to Test!

After migration:
1. Backend will start using new status tracking automatically
2. Submit a new answer with `generate_feedback=true`
3. Poll `/api/feedback/status/answer/{answer_id}` to see progress
4. Old feedback will still display normally

**All set!** 🚀
