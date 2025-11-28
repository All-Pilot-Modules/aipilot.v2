# Email Verification Setup Guide

Complete implementation of email verification with 6-digit codes and magic links for AI Pilot.

## What's Been Implemented

### Backend Changes

1. **User Model** (`Backend/app/models/user.py`)
   - Added 5 new fields for email verification
   - `is_email_verified`, `verification_code`, `verification_code_expires`, `verification_token`, `verification_token_expires`

2. **Email Service** (`Backend/app/core/email.py`)
   - Gmail SMTP integration (free up to 500 emails/day)
   - Beautiful HTML email templates
   - Sends both 6-digit code AND magic link in one email
   - Automatic expiry (code: 15 min, token: 24 hours)

3. **API Endpoints** (`Backend/app/api/routes/auth.py`)
   - `POST /api/auth/verify-email/code` - Verify with 6-digit code
   - `GET /api/auth/verify-email/token` - Verify via magic link
   - `POST /api/auth/verify-email/resend` - Resend verification email
   - Updated `/register` to send verification email
   - Updated `/login` to block unverified users (403 error)

### Frontend Changes

1. **Verification Page** (`Frontend/app/verify-email/page.js`)
   - Beautiful UI with 6-digit code input
   - Auto-focus and auto-submit
   - Magic link support (clicks from email)
   - Resend email functionality
   - Error handling and success messages

2. **Registration Flow** (`Frontend/components/auth/RegisterForm.jsx`)
   - Redirects to verification page after signup (no auto-login)

3. **Login Flow** (`Frontend/components/auth/LoginForm.jsx`)
   - Detects unverified email and redirects to verification page

---

## Setup Instructions

### Step 1: Update Environment Variables

Add these to your `Backend/.env` file:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=AI Pilot
FRONTEND_URL=http://localhost:3000
```

### Step 2: Get Gmail App Password (Free!)

Since you're using Gmail, you need an "App Password" (NOT your regular Gmail password):

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled
4. Search for "App passwords" or go to: https://myaccount.google.com/apppasswords
5. Create a new app password:
   - Select "Mail" as the app
   - Select "Other" as the device and name it "AI Pilot"
6. Copy the 16-character password (no spaces)
7. Paste it as `EMAIL_PASSWORD` in your `.env` file

**Important:** This is a one-time generated password specific to this app. Your regular Gmail password won't work for SMTP.

### Step 3: Recreate Database

Since you mentioned you're okay deleting and recreating the database:

```bash
# Drop existing users table and recreate with new fields
# (Or just delete the database and start fresh)
cd Backend
python -c "from app.database import engine, Base; from app.models.user import User; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"
```

OR if you want to run the migration:

```bash
cd Backend
python migrations/add_email_verification_fields.py
```

### Step 4: Start Your Servers

```bash
# Terminal 1 - Backend
cd Backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

---

## Testing the Flow

### Test 1: Registration with Email Verification

1. Go to http://localhost:3000/sign-up
2. Fill in the registration form with a REAL email address you can access
3. Click "Sign Up"
4. You should be redirected to `/verify-email?email=your@email.com`
5. Check your email inbox for verification email (check spam if not found)
6. You'll see a beautiful email with:
   - A 6-digit code (e.g., `123456`)
   - A "Verify Email" button (magic link)

### Test 2: Verify with 6-Digit Code

1. On the verification page, enter the 6-digit code from email
2. Code auto-submits when all 6 digits are entered
3. Success message appears
4. Redirects to login page after 2 seconds
5. You receive a welcome email

### Test 3: Verify with Magic Link

1. Click the "Verify Email" button in the email
2. Opens `/verify-email?token=xxx...`
3. Automatically verifies (no code entry needed)
4. Success message appears
5. Redirects to login page

### Test 4: Login Protection

1. Try to login WITHOUT verifying email first
2. You should get a 403 error
3. Automatically redirects to verification page
4. Can resend email if needed

### Test 5: Resend Email

1. On verification page, click "Resend Email"
2. New verification code and token generated
3. New email sent
4. Old code/token no longer work

### Test 6: Expired Code

1. Wait 15+ minutes after registration
2. Try entering the code
3. Should get "Verification code has expired" error
4. Click "Resend Email" to get new code

---

## Development Mode (Without Email)

If you DON'T configure email credentials, the system will:
- Print verification codes to console/logs
- Print verification tokens to console/logs
- NOT send actual emails
- You can copy codes from logs for testing

Example console output:
```
Warning: Email credentials not configured. Email not sent.
Verification code for user@example.com: 542817
Verification token: abc123xyz456...
```

---

## Email Template Preview

The verification email looks like this:

```
┌─────────────────────────────────────┐
│     Verify Your Email              │
│                                     │
│  Hi username,                       │
│                                     │
│  Thank you for signing up!          │
│                                     │
│  Option 1: Enter this code          │
│  ┌─────────────────────┐           │
│  │     5  4  2  8  1  7│           │
│  └─────────────────────┘           │
│  This code expires in 15 minutes    │
│                                     │
│  - OR -                             │
│                                     │
│  Option 2: Click the button         │
│  ┌─────────────────────┐           │
│  │  Verify Email       │           │
│  └─────────────────────┘           │
│  This link expires in 24 hours      │
│                                     │
│  If you didn't sign up, ignore this │
└─────────────────────────────────────┘
```

---

## API Reference

### Verify Email with Code
```bash
POST /api/auth/verify-email/code?email=user@example.com&code=123456
```

Response:
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "username": "johndoe",
    "is_email_verified": true
  }
}
```

### Verify Email with Token (Magic Link)
```bash
GET /api/auth/verify-email/token?token=abc123xyz...
```

Response:
```json
{
  "message": "Email verified successfully",
  "redirect": "/login",
  "user": { ... }
}
```

### Resend Verification Email
```bash
POST /api/auth/verify-email/resend?email=user@example.com
```

Response:
```json
{
  "message": "Verification email sent successfully",
  "email": "user@example.com"
}
```

---

## Troubleshooting

### Email Not Sending

1. **Check Gmail App Password**
   - Make sure you used App Password, not regular password
   - App Password should be 16 characters

2. **Check 2-Step Verification**
   - Must be enabled to create App Passwords
   - Go to Google Account → Security

3. **Check .env File**
   - No quotes around values
   - No spaces in EMAIL_PASSWORD

4. **Check Firewall/Network**
   - Port 587 must be open
   - Some networks block SMTP

5. **Check Console Logs**
   - Backend prints verification codes if email fails
   - Use codes from logs for testing

### Code Not Working

1. **Check Expiry**
   - Codes expire in 15 minutes
   - Click "Resend Email" for new code

2. **Check Email Match**
   - Code is tied to specific email
   - Case-sensitive

3. **Check Database**
   - User must exist in database
   - `is_email_verified` should be `false`

### Magic Link Not Working

1. **Check Token Expiry**
   - Tokens expire in 24 hours
   - Request new verification email

2. **Check Frontend URL**
   - `FRONTEND_URL` in .env must match your actual frontend URL
   - Default: http://localhost:3000

---

## Security Features

1. **Bcrypt Password Hashing** - 12 rounds
2. **Short Code Expiry** - 15 minutes
3. **Token Expiry** - 24 hours
4. **One-Time Use** - Codes/tokens deleted after verification
5. **Login Protection** - Unverified users cannot login
6. **Secure Token Generation** - URL-safe random tokens

---

## Alternative Email Providers

If you don't want to use Gmail, you can use:

### SendGrid (100 emails/day free)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USERNAME=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Brevo (300 emails/day free)
```bash
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USERNAME=your-brevo-email
EMAIL_PASSWORD=your-brevo-smtp-key
```

### Mailgun (100 emails/day free)
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USERNAME=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

---

## Production Deployment

Before deploying to production:

1. **Use Environment-Specific URLs**
   ```bash
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Use Professional Email Service**
   - Avoid Gmail for production
   - Use SendGrid, AWS SES, or Mailgun
   - Better deliverability

3. **Enable HTTPS**
   - Magic links should use HTTPS
   - Prevents token interception

4. **Rate Limiting**
   - Consider adding rate limits to resend endpoint
   - Prevent email spam

5. **Monitor Email Sending**
   - Log all email attempts
   - Alert on failures

---

## Need Help?

If you run into issues:

1. Check Backend logs for error messages
2. Check Frontend console for network errors
3. Verify all environment variables are set
4. Test with console codes first (no email setup)
5. Make sure database has new fields

---

## Summary

Email verification is now fully implemented with:
- ✅ 6-digit code verification
- ✅ Magic link verification
- ✅ Email resending
- ✅ Beautiful HTML emails
- ✅ Login protection
- ✅ Free Gmail SMTP
- ✅ Professional templates
- ✅ Error handling
- ✅ Expiry handling

Users can choose between:
1. Entering 6-digit code manually
2. Clicking magic link in email

Both methods work seamlessly!
