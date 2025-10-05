# Production Deployment Checklist - Email System

## 🚀 Pre-Deployment

### 1. SMTP Provider Setup

- [ ] **Create SendGrid account** (or alternative SMTP provider)
- [ ] **Generate API key** with Mail Send permissions
- [ ] **Verify sender email/domain** in provider dashboard
- [ ] **Set up domain authentication** (SPF, DKIM, DMARC records)
- [ ] **Test SMTP credentials** locally first

### 2. Environment Variables

**Required Variables for Production:**

```env
# Frontend URL (CRITICAL - must match your deployment)
FRONTEND_URL=https://cloud-xl.vercel.app

# SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-production-api-key-here
MAIL_FROM="CloudXL Team <no-reply@cloudxl.app>"
```

**Verify in your hosting platform:**
- [ ] All variables are set
- [ ] No typos in variable names
- [ ] FRONTEND_URL matches your actual domain
- [ ] MAIL_FROM uses verified email/domain
- [ ] API key is correct and active

### 3. Code Verification

- [ ] **Backend files exist**:
  - `backend/utils/mailer.js`
  - `backend/utils/templates/inviteEmail.js`
- [ ] **Routes updated**: `backend/routes/teams.js` imports mailer
- [ ] **Frontend updated**: `JoinTeam.jsx` supports query params
- [ ] **Dependencies installed**: `nodemailer` in package.json

### 4. Local Testing

- [ ] **Test with Ethereal Email** (fake SMTP)
- [ ] **Test with real SMTP** (SendGrid/SES)
- [ ] **Verify email received** in inbox
- [ ] **Click join link** and confirm it works
- [ ] **Test error scenarios** (invalid token, expired invite)
- [ ] **Check console logs** for any errors

## 🌐 Deployment Steps

### For Vercel (Backend)

1. **Set environment variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all SMTP variables
   - Make sure they're available for Production environment

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add email invitation system"
   git push
   ```

3. **Verify deployment**:
   - Check deployment logs for errors
   - Verify environment variables are loaded

### For Vercel (Frontend)

1. **Deploy** (if separate repo):
   ```bash
   git add .
   git commit -m "Update JoinTeam to support email links"
   git push
   ```

2. **Verify**:
   - Test `/teams/join?token=test` route exists
   - Check browser console for errors

## ✅ Post-Deployment Testing

### 1. Smoke Test

- [ ] **Login** to production app
- [ ] **Create a team** (as admin)
- [ ] **Invite yourself** to the team
- [ ] **Check email** arrives within 1 minute
- [ ] **Click join link** in email
- [ ] **Verify** you're added to team

### 2. Email Deliverability

- [ ] **Check inbox** (not spam)
- [ ] **Test multiple email providers** (Gmail, Outlook, etc.)
- [ ] **Verify sender name** displays correctly
- [ ] **Check email formatting** (HTML renders properly)
- [ ] **Test on mobile** email clients

### 3. Error Scenarios

- [ ] **Invalid token**: Shows error message
- [ ] **Expired invitation**: Shows appropriate error
- [ ] **Already a member**: Handles gracefully
- [ ] **SMTP failure**: Invitation still created, emailSent=false

### 4. Performance

- [ ] **Email sends quickly** (< 5 seconds)
- [ ] **No timeout errors** in logs
- [ ] **API responds** even if email fails
- [ ] **Check rate limits** with SMTP provider

## 🔒 Security Checklist

- [ ] **API keys** not committed to git
- [ ] **Environment variables** set in hosting platform only
- [ ] **SMTP credentials** are secure
- [ ] **Email tokens** are unique and random (UUID)
- [ ] **Invitations expire** after 7 days
- [ ] **Rate limiting** considered for invite endpoint

## 📊 Monitoring

### Set Up Alerts For:

- [ ] **Email send failures** (check logs)
- [ ] **High bounce rates** (in SMTP provider dashboard)
- [ ] **Spam complaints** (in SMTP provider dashboard)
- [ ] **API errors** on invite endpoint

### Monitor These Metrics:

- [ ] **Email delivery rate** (should be > 95%)
- [ ] **Email open rate** (track in SMTP provider)
- [ ] **Join link click rate**
- [ ] **Successful team joins** vs invitations sent

## 🐛 Common Issues & Solutions

### Issue: Emails not sending

**Check:**
1. Environment variables are set correctly
2. SMTP credentials are valid
3. Sender email is verified
4. Port 587 is not blocked
5. API key has correct permissions

**Solution:**
- Review backend logs for specific error
- Test SMTP connection with a tool
- Verify API key in provider dashboard

### Issue: Emails go to spam

**Check:**
1. Domain authentication (SPF/DKIM) is set up
2. Sender reputation is good
3. Email content doesn't trigger spam filters
4. Using a verified domain (not @gmail.com)

**Solution:**
- Set up domain authentication in SendGrid
- Use a custom domain for MAIL_FROM
- Warm up your sending domain gradually

### Issue: Wrong link in email

**Check:**
1. FRONTEND_URL environment variable
2. Token is being generated correctly
3. Link format matches frontend route

**Solution:**
- Update FRONTEND_URL to match deployment
- Verify route exists in App.jsx
- Test link manually

### Issue: Join link doesn't work

**Check:**
1. Frontend route for `/teams/join` exists
2. Token is valid and not expired
3. User is authenticated
4. Backend API is accessible

**Solution:**
- Check browser console for errors
- Verify API endpoint is reachable
- Test with a fresh invitation

## 📝 Documentation

- [ ] **Update README** with email setup instructions
- [ ] **Document SMTP provider** choice and setup
- [ ] **Add troubleshooting guide** for team
- [ ] **Create runbook** for common issues

## 🎯 Success Criteria

Your email system is production-ready when:

✅ Emails are delivered within 1 minute
✅ Emails land in inbox (not spam)
✅ Join links work on first click
✅ Error handling is graceful
✅ Monitoring is in place
✅ Team knows how to troubleshoot

## 📞 Support Resources

- **SendGrid Status**: https://status.sendgrid.com/
- **SendGrid Support**: https://support.sendgrid.com/
- **Nodemailer Docs**: https://nodemailer.com/
- **Email Testing Tool**: https://www.mail-tester.com/

## 🔄 Rollback Plan

If issues occur in production:

1. **Disable email sending**:
   - Remove SMTP environment variables
   - System will still create invitations
   - Admins can manually share invite links

2. **Revert code**:
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Investigate**:
   - Check logs for errors
   - Test in staging environment
   - Fix issues before re-deploying

---

## ✨ Final Checklist

Before marking as complete:

- [ ] All environment variables set
- [ ] SMTP provider configured and tested
- [ ] Domain authentication set up
- [ ] Production deployment successful
- [ ] Smoke tests passed
- [ ] Email deliverability verified
- [ ] Error handling tested
- [ ] Monitoring in place
- [ ] Team trained on troubleshooting
- [ ] Documentation updated

---

**Deployment Date**: _____________

**Deployed By**: _____________

**SMTP Provider**: _____________

**Notes**: _____________________________________________
