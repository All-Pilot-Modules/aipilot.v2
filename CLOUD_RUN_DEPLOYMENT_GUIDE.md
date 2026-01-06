# Cloud Run Deployment Guide for AI Pilot Backend

## Problem You're Seeing

```
The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable
```

**Root Cause**: Missing environment variables in Cloud Run. The port configuration is correct (8080), but the app crashes during startup because it can't connect to the database without `DATABASE_URL`.

## Quick Fix: Set Environment Variables in Cloud Run Console

### Step 1: Go to Cloud Run Console

1. Open https://console.cloud.google.com/run
2. Click on your backend service (e.g., `ai-pilot-backend`)
3. Click **"EDIT & DEPLOY NEW REVISION"** button at the top

### Step 2: Add Environment Variables

1. Click on the **"Variables & Secrets"** tab
2. Under "Environment variables", click **"+ ADD VARIABLE"**
3. Add these **required** variables one by one:

#### Required Variables

| Variable Name | Example Value | Where to Get It |
|--------------|---------------|-----------------|
| `OPENAI_API_KEY` | `sk-proj-...` | https://platform.openai.com/api-keys |
| `DATABASE_URL` | `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres` | Supabase Dashboard → Settings → Database |
| `JWT_SECRET` | `your-random-secret-here` | Generate with: `openssl rand -hex 32` |
| `SUPABASE_URL` | `https://[PROJECT].supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API (service_role key) |

#### Optional Variables

| Variable Name | Default Value | Description |
|--------------|---------------|-------------|
| `ENV` | `production` | Environment name |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your frontend URL for CORS |
| `EMAIL_USERNAME` | (empty) | Gmail address for sending emails |
| `EMAIL_PASSWORD` | (empty) | Gmail app password |

### Step 3: Deploy

1. Click **"DEPLOY"** button at the bottom
2. Wait for deployment to complete (~2-3 minutes)
3. Check the logs to verify startup succeeded

### Step 4: Verify Deployment

1. Click on your service URL (e.g., `https://ai-pilot-backend-xxx.run.app`)
2. You should see: `{"message":"Server is running"}`
3. Check logs for startup messages:
   ```
   🚀 App startup initiated...
   ✅ All required environment variables are set
   📊 Creating database tables...
   ✅ All tables created successfully
   🎉 Application startup complete!
   ```

---

## Alternative: Use gcloud CLI

If you prefer command line:

```bash
# Set service name and region
SERVICE_NAME="ai-pilot-backend"
REGION="us-central1"  # Change to your region

# Deploy with environment variables
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="OPENAI_API_KEY=sk-proj-..." \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --set-env-vars="JWT_SECRET=your-secret" \
  --set-env-vars="SUPABASE_URL=https://..." \
  --set-env-vars="SUPABASE_SERVICE_KEY=eyJhbGc..." \
  --set-env-vars="ENV=production" \
  --set-env-vars="FRONTEND_URL=https://your-frontend.com"
```

---

## Best Practice: Use Secret Manager (Recommended for Production)

### Step 1: Create Secrets in Secret Manager

```bash
# Create secrets (one-time setup)
echo -n "sk-proj-YOUR_OPENAI_KEY" | gcloud secrets create openai-api-key --data-file=-
echo -n "postgresql://USER:PASS@HOST:5432/DB" | gcloud secrets create database-url --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "https://PROJECT.supabase.co" | gcloud secrets create supabase-url --data-file=-
echo -n "eyJhbGc..." | gcloud secrets create supabase-service-key --data-file=-
```

### Step 2: Grant Cloud Run Access to Secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

for SECRET in openai-api-key database-url jwt-secret supabase-url supabase-service-key; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Step 3: Update cloudbuild.yaml

Uncomment the deploy step in `cloudbuild.yaml` and configure it:

```yaml
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
    - 'run'
    - 'deploy'
    - 'ai-pilot-backend'
    - '--image=gcr.io/$PROJECT_ID/ai-pilot-backend:$COMMIT_SHA'
    - '--region=us-central1'
    - '--platform=managed'
    - '--allow-unauthenticated'
    - '--port=8080'
    - '--timeout=300'
    - '--set-secrets=OPENAI_API_KEY=openai-api-key:latest'
    - '--set-secrets=DATABASE_URL=database-url:latest'
    - '--set-secrets=JWT_SECRET=jwt-secret:latest'
    - '--set-secrets=SUPABASE_URL=supabase-url:latest'
    - '--set-secrets=SUPABASE_SERVICE_KEY=supabase-service-key:latest'
```

---

## Troubleshooting

### Check Logs

```bash
gcloud run services logs read ai-pilot-backend --region=us-central1 --limit=50
```

Look for:
- ✅ `All required environment variables are set`
- ✅ `Application startup complete!`
- ❌ `Missing required environment variables:` (means env vars not set)

### Common Errors

#### Error: "Missing required environment variables"

**Solution**: Go back to Step 2 and add all required variables.

#### Error: "Connection to database failed"

**Solution**: Check your `DATABASE_URL` is correct. Get it from Supabase → Settings → Database → Connection String (use Pooler mode).

#### Error: "Invalid JWT secret"

**Solution**: Generate a new secret: `openssl rand -hex 32`

### Verify Environment Variables Are Set

```bash
gcloud run services describe ai-pilot-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

---

## Files Changed

- ✅ `Backend/app/core/config.py` - Better error messages, no validation at import time
- ✅ `Backend/main.py` - Validates env vars during startup (after port binding)
- ✅ `cloudbuild.yaml` - Added commented deploy step with examples
- ✅ `Backend/Dockerfile` - Already correct (listens on port 8080)

## Next Steps

1. **IMMEDIATE**: Set environment variables in Cloud Run console (Steps above)
2. **DEPLOY**: Click "DEPLOY" to create new revision
3. **VERIFY**: Test your backend URL - should see `{"message":"Server is running"}`
4. **PRODUCTION**: Consider using Secret Manager for better security

## Support

If you still see errors after following this guide:
1. Check Cloud Run logs
2. Verify all 5 required environment variables are set
3. Test database connection from Supabase dashboard
