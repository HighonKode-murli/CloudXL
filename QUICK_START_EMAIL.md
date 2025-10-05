# Quick Start: Email Invitations

## 🚀 Get Email Invitations Working in 5 Minutes

### Step 1: Choose Your SMTP Provider

**Recommended: SendGrid (Free tier available)**

1. Go to https://sendgrid.com/free/
2. Sign up for free account
3. Verify your email
4. Go to Settings → API Keys
5. Create new API key with "Mail Send" permissions
6. Copy the API key (you'll need it next)

### Step 2: Configure Environment Variables

**For Production (Vercel/Heroku/etc.)**

Add these to your hosting platform's environment variables:

```env
FRONTEND_URL=https://cloud-xl.vercel.app
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-actual-api-key-here
MAIL_FROM="CloudXL Team <no-reply@cloudxl.app>"
```

**For Local Development**

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and add:
   ```env
   FRONTEND_URL=http://localhost:5173
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-actual-api-key-here
   MAIL_FROM="CloudXL Team <no-reply@cloudxl.app>"
   ```

### Step 3: Verify Sender Email (SendGrid)

1. In SendGrid dashboard, go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details (use a real email you can access)
4. Check your email and click verification link
5. Use this verified email in `MAIL_FROM`

### Step 4: Test It!

1. **Start your backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the flow**:
   - Login as admin user
   - Go to Teams page
   - Create a team
   - Invite a user (use your own email for testing)
   - Check your inbox!

### Step 5: Verify Email Received

Check your email inbox for:
- **Subject**: "Invitation to join [Team Name] on CloudXL"
- **From**: CloudXL Team <no-reply@cloudxl.app>
- **Content**: Professional email with "Join Team" button

Click the button and you should be redirected to join the team!

---

## 🐛 Troubleshooting

### Email not sending?

**Check the console logs**:
```bash
# Look for this in your backend terminal:
Invite email send failed: [error details]
```

**Common issues**:

1. **Wrong API key**: Make sure you copied the full SendGrid API key
2. **Unverified sender**: Verify your sender email in SendGrid
3. **Wrong SMTP_USER**: For SendGrid, it must be exactly `apikey` (not your email)
4. **Port blocked**: Make sure port 587 is not blocked by firewall

### Email goes to spam?

1. **Verify your domain** in SendGrid (Settings → Sender Authentication → Domain Authentication)
2. **Use a real domain** instead of @gmail.com in MAIL_FROM
3. **Set up SPF/DKIM** records (SendGrid provides these)

### Wrong link in email?

Check `FRONTEND_URL` in your `.env`:
- Production: `https://cloud-xl.vercel.app`
- Local: `http://localhost:5173`

---

## 🎯 Alternative: Test Without Real SMTP

**Use Ethereal Email (Fake SMTP for testing)**

1. Go to https://ethereal.email/create
2. Copy the credentials shown
3. Update your `.env`:
   ```env
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=<username from ethereal>
   SMTP_PASS=<password from ethereal>
   MAIL_FROM="CloudXL Team <no-reply@cloudxl.app>"
   ```
4. Send test invitation
5. View email at https://ethereal.email/messages

**Benefits**: 
- No signup required
- Instant setup
- View emails in web interface
- Perfect for development

---

## 📋 Checklist

- [ ] SMTP provider account created (SendGrid recommended)
- [ ] API key generated
- [ ] Sender email verified
- [ ] Environment variables configured
- [ ] Backend restarted with new env vars
- [ ] Test invitation sent
- [ ] Email received in inbox
- [ ] Join link works correctly

---

## 🎉 Success!

If you received the email and can join the team via the link, you're all set!

The system will now automatically send professional invitation emails whenever a team admin invites a new member.

---

## 📞 Need Help?

- Check `EMAIL_SETUP.md` for detailed documentation
- Check `EMAIL_IMPLEMENTATION_SUMMARY.md` for technical details
- Review backend console logs for error messages
- Test with Ethereal Email first to isolate SMTP issues
