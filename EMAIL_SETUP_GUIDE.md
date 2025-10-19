# Email Setup Guide

## 🚨 IMPORTANT: Invitation Emails Were Not Being Sent

### Problem
Team invitation emails were not being delivered because the system was using console logging instead of actually sending emails.

### Root Cause
1. No SMTP configuration in `.env.local`
2. Email service was falling back to `streamTransport` which only logs to console
3. Invitation methods weren't using the company email integration

### ✅ Fix Applied
All invitation emails now use your **company's email integration** (ZeptoMail, SendGrid, or Resend) if configured, with automatic fallback to SMTP.

---

## Quick Setup (Choose One)

You have **3 options** to send emails:

### Option 1: Use Email Integration (Recommended) ⭐
Configure an email provider in your company settings dashboard.

### Option 2: Use ZeptoMail from Environment Variables (New!)
Add ZeptoMail credentials to `.env.local` for automatic email sending without database configuration.

### Option 3: Use SMTP Fallback
Add SMTP credentials to `.env.local` for a basic email setup.

---

## Option 1: Email Integration Setup (Recommended)

### Step 1: Go to Integrations Page
Navigate to: `/dashboard/{your-company-slug}/integrations`

### Step 2: Add Email Integration

Choose one of these providers:

#### A) ZeptoMail (Recommended for High Deliverability)
1. Sign up at [https://www.zoho.com/zeptomail/](https://www.zoho.com/zeptomail/)
2. Get your API key from ZeptoMail dashboard
3. In your app integrations page, click **"Add Integration"**
4. Select **ZeptoMail**
5. Fill in:
   - **API Key**: Your ZeptoMail API key
   - **From Email**: `noreply@yourdomain.com` (must be verified in ZeptoMail)
   - **From Name**: `Your Company Name`
6. Click **Save**
7. Toggle **"Set as Primary"** to make it the default
8. Click **"Send Test Email"** to verify

#### B) SendGrid
1. Sign up at [https://sendgrid.com/](https://sendgrid.com/)
2. Create an API key with **Mail Send** permissions
3. In your app integrations page, add SendGrid integration
4. Provide API key, from email (verified sender), and from name
5. Set as primary and test

#### C) Resend (Developer-Friendly)
1. Sign up at [https://resend.com/](https://resend.com/)
2. Get your API key
3. Add domain and verify DNS records
4. In your app integrations page, add Resend integration
5. Provide API key, from email, and from name
6. Set as primary and test

---

## Option 2: ZeptoMail from Environment Variables (New!)

This is the **easiest and fastest** way to get email working. No database configuration needed!

### Step 1: Get Your ZeptoMail Credentials
1. Sign up at [https://www.zoho.com/zeptomail/](https://www.zoho.com/zeptomail/)
2. Verify your domain (or use Zoho's test domain for development)
3. Get your API key from the ZeptoMail dashboard
4. Note your verified sender email address

### Step 2: Add to `.env.local`

Open your `.env.local` file and add:

```bash
# ZeptoMail Configuration
ZEPTOMAIL_API_KEY=your_actual_api_key_here
ZEPTOMAIL_FROM_EMAIL=noreply@yourdomain.com
ZEPTOMAIL_FROM_NAME=Seller Gift
```

### Step 3: Restart Your Dev Server

```bash
# Stop your server (Ctrl+C) and restart
yarn dev
```

That's it! 🎉 Your emails will now be sent via ZeptoMail automatically.

### How It Works

The email service will now follow this priority:

1. **Company Email Integration** (if configured in database)
   ↓
2. **ZeptoMail from `.env.local`** (if `ZEPTOMAIL_API_KEY` is set) ⭐ YOU ARE HERE
   ↓
3. **SMTP** (if `SMTP_HOST` is set)
   ↓
4. **Console Logging** (development fallback)

### Benefits of This Approach

✅ **No Database Setup Required** - Just environment variables
✅ **Works Immediately** - No need to configure integrations in the UI
✅ **Per-Company Override** - Companies can still add their own email integrations
✅ **Production Ready** - ZeptoMail has high deliverability rates
✅ **Cost Effective** - ZeptoMail has generous free tier

---

## Option 3: SMTP Fallback Setup

If you don't want to use ZeptoMail or an integration, add these to your `.env.local`:

```bash
# SMTP Configuration (Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Your Company <noreply@yourcompany.com>"
```

### Gmail SMTP Example
1. Enable 2-Factor Authentication on your Google account
2. Create an **App Password**: https://myaccount.google.com/apppasswords
3. Use that app password in `SMTP_PASSWORD`

### Other SMTP Providers
- **AWS SES**: `smtp_host=email-smtp.us-east-1.amazonaws.com`, `smtp_port=587`
- **Mailgun**: `smtp_host=smtp.mailgun.org`, `smtp_port=587`
- **SendGrid SMTP**: `smtp_host=smtp.sendgrid.net`, `smtp_port=587`

---

## How It Works Now

### Email Sending Flow

```
Team Invitation Sent
        ↓
1. Check for company's primary email integration
   ├─ Found: Use ZeptoMail/SendGrid/Resend (from database)
   └─ Not found: ↓
        ↓
2. Check for ZEPTOMAIL_API_KEY in environment
   ├─ Found: Use ZeptoMail (from .env.local) ⭐ NEW!
   └─ Not found: ↓
        ↓
3. Check for SMTP configuration in environment
   ├─ Found: Use SMTP
   └─ Not found: Log to console (dev only)
        ↓
4. If any method fails → Log error and throw
```

### Email Methods Updated

All these methods now support company integrations:

- ✅ `sendTeamInvitation()` - When inviting team members
- ✅ `sendWelcomeToNewMember()` - After invitation accepted
- ✅ `sendInvitationAcceptedToInviter()` - Notify inviter
- ✅ `sendMembershipRevoked()` - When removing members

---

## Testing Your Setup

### 1. Send a Test Email (Integration)
```bash
# From your integrations page
1. Click on your email integration
2. Click "Send Test Email"
3. Enter a test email address
4. Check inbox (and spam folder)
```

### 2. Test Team Invitation
```bash
# In your team page
1. Click "Invite Member"
2. Enter email and select role
3. Click "Send Invitation"
4. Check console logs for: "📧 Email sent via [provider]"
5. Verify invitee receives email
```

### 3. Check Logs
```bash
# Start your dev server with logging
npm run dev

# Look for these logs when sending invitations:
📧 sendViaIntegration called for company: comp_xxx...
📧 Integration found: { provider: 'zeptomail', ... }
📧 Sending email via provider: zeptomail
✅ Email sent successfully via zeptomail
```

---

## Troubleshooting

### Emails Still Not Sending?

#### 1. Check Console Logs
Look for errors like:
- `⚠️ No primary email integration found, falling back to SMTP`
- `❌ Failed to send email via integration:`
- `⚠️ SMTP not configured - emails will be logged to console`

#### 2. Verify Integration Settings
```bash
# Run this in MongoDB Compass or CLI:
db.integrations.find({
  type: "email",
  primary: true,
  enabled: true
})

# Should return your email integration
```

#### 3. Check Integration Encryption
Make sure `INTEGRATION_ENCRYPTION_KEY` is set in `.env.local`:
```bash
INTEGRATION_ENCRYPTION_KEY=your-32-character-key-here
```

#### 4. Test API Keys Manually
```bash
# For ZeptoMail
curl -X POST https://api.zeptomail.com/v1.1/email \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"address": "noreply@yourdomain.com"},
    "to": [{"email_address": {"address": "test@example.com"}}],
    "subject": "Test",
    "htmlbody": "<p>Test email</p>"
  }'
```

### Common Errors

#### "INTEGRATION_ENCRYPTION_KEY must be set"
**Solution:** Add encryption key to `.env.local`

#### "No primary email integration found"
**Solution:**
1. Go to integrations page
2. Add an email integration
3. Toggle "Set as Primary"

#### "SMTP not configured"
**Solution:** Either:
- Option A: Add email integration (recommended)
- Option B: Add SMTP settings to `.env.local`

#### "Email sent to console only"
**Solution:** You're in development mode without proper configuration. Follow Option 1 or 2 above.

---

## Production Deployment

### Required Environment Variables

```bash
# Required for email integrations
INTEGRATION_ENCRYPTION_KEY=your-production-encryption-key

# Optional SMTP fallback
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
SMTP_FROM="Your Company <noreply@yourcompany.com>"

# Required for invitation links
NEXTAUTH_URL=https://yourdomain.com
```

### Best Practices

1. **Use Email Integration (Not SMTP)**
   - Better deliverability
   - Better analytics
   - Encrypted credentials in database

2. **Verify Your Domain**
   - Set up SPF, DKIM, DMARC records
   - Improves deliverability
   - Prevents spam marking

3. **Monitor Email Logs**
   - Check console logs for failures
   - Set up alerting for email errors
   - Track delivery rates

4. **Test Before Going Live**
   - Send test invitations
   - Check spam folder
   - Verify all email templates render correctly

---

## Email Template Customization

All email templates are in: `src/lib/services/email.service.ts`

Methods you can customize:
- `sendTeamInvitation()` - Lines 317-400
- `sendWelcomeToNewMember()` - Lines 538-610
- `sendInvitationAcceptedToInviter()` - Lines 466-533
- `sendMembershipRevoked()` - Lines 423-461

---

## Security Notes

✅ **Security Fixes Applied:**
1. API keys stored encrypted in database
2. HTML escaping prevents XSS in emails
3. Rate limiting prevents email spam (10/hour per company)
4. Proper error handling (doesn't expose sensitive data)

---

## Summary

**Before Fix:**
- ❌ Emails logged to console only
- ❌ No actual delivery
- ❌ No integration support

**After Fix:**
- ✅ Uses company email integration (database)
- ✅ **NEW: Falls back to ZeptoMail from environment variables** ⭐
- ✅ Falls back to SMTP if configured
- ✅ Proper error handling
- ✅ Rate limiting
- ✅ Security hardened

**Email Priority (Cascading Fallback):**
1. Company email integration in database (per-company settings)
2. **ZeptoMail from `.env.local` (global fallback)** ⭐ NEW!
3. SMTP from `.env.local` (traditional fallback)
4. Console logging (development only)

**Next Steps:**
1. Choose one option:
   - **Option 1**: Configure per-company email integration in dashboard (most flexible)
   - **Option 2**: Add ZeptoMail credentials to `.env.local` (quickest) ⭐ RECOMMENDED
   - **Option 3**: Add SMTP credentials to `.env.local` (traditional)
2. Configure your chosen method
3. Send a test invitation
4. Verify email delivery

Need help? Check the troubleshooting section above.
