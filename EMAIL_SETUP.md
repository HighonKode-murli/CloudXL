# Email Invitation System Setup

The team invitation system now sends email notifications when users are invited to join a team.

## Features

- ✅ Automatic email sending when team invitations are created
- ✅ Professional HTML email templates with team details
- ✅ Graceful failure handling (invitation is saved even if email fails)
- ✅ Frontend join link embedded in emails
- ✅ Support for multiple SMTP providers (SendGrid, AWS SES, Mailgun, etc.)

## Configuration

### Environment Variables

Add the following variables to your `.env` file in the `backend` directory:

```env
# Frontend URL (production)
FRONTEND_URL=https://cloud-xl.vercel.app

# Email Configuration (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
MAIL_FROM="CloudXL Team <no-reply@cloudxl.app>"
```

### SMTP Provider Options

#### Option 1: SendGrid (Recommended)
1. Sign up at https://sendgrid.com
2. Create an API key
3. Use these settings:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

#### Option 2: AWS SES
1. Set up AWS SES and verify your domain
2. Create SMTP credentials
3. Use these settings:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   ```

#### Option 3: Mailgun
1. Sign up at https://mailgun.com
2. Get your SMTP credentials
3. Use these settings:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-smtp-username
   SMTP_PASS=your-mailgun-smtp-password
   ```

#### Option 4: Gmail (Development Only)
⚠️ Not recommended for production
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-specific-password
```

## How It Works

### Backend Flow

1. **Team admin sends invitation** via `POST /teams/:teamId/invite`
2. **System creates invitation record** in database with unique token
3. **Email is composed** using the template with:
   - Team name
   - Inviter's email
   - Role/profile
   - Join link with token
4. **Email is sent** via SMTP
5. **Response includes**:
   - `inviteLink`: The join URL
   - `emailSent`: Boolean indicating if email was successfully sent

### Email Template

The email includes:
- Professional HTML formatting
- Team name and role information
- Clickable "Join Team" button
- Plain text fallback link
- Plain text version for email clients that don't support HTML

### Frontend Join Flow

Users receive an email with a link like:
```
https://cloud-xl.vercel.app/teams/join?token=abc123...
```

When clicked, they are directed to the JoinTeam page which:
1. Extracts the token from URL
2. Authenticates the user (or redirects to login)
3. Calls `POST /teams/join/:token` to accept the invitation
4. Redirects to the team dashboard

## API Response

The invite endpoint now returns:

```json
{
  "message": "Invitation created",
  "inviteLink": "https://cloud-xl.vercel.app/teams/join?token=abc123...",
  "emailSent": true
}
```

- `emailSent: true` - Email was successfully sent
- `emailSent: false` - Email failed (but invitation was still created)

## Error Handling

The system is designed to be resilient:

1. **Email failure doesn't block invitation creation**
   - Invitation is saved to database first
   - Email sending is attempted after
   - If email fails, invitation still exists and can be used

2. **Frontend can show fallback UI**
   - Check `emailSent` flag in response
   - If false, show a "Copy Link" button
   - Allow admin to manually share the link

3. **Logging**
   - Email failures are logged to console
   - Includes error details for debugging

## Testing

### Local Development

For local testing without a real SMTP server, you can use:

1. **Ethereal Email** (fake SMTP for testing)
   - Visit https://ethereal.email
   - Create a test account
   - Use the provided SMTP credentials
   - View sent emails in their web interface

2. **MailHog** (local SMTP server)
   - Install: `docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`
   - Use: `SMTP_HOST=localhost`, `SMTP_PORT=1025`
   - View emails at http://localhost:8025

### Testing the Flow

1. Create a team (as admin user)
2. Invite a user with a valid email
3. Check the response for `emailSent: true`
4. Check the recipient's inbox
5. Click the join link
6. Verify the user is added to the team

## Files Added/Modified

### New Files
- `backend/utils/mailer.js` - Nodemailer configuration and sendMail function
- `backend/utils/templates/inviteEmail.js` - Email template generator

### Modified Files
- `backend/routes/teams.js` - Updated invite route to send emails
- `backend/.env.example` - Added SMTP configuration variables
- `backend/package.json` - Added nodemailer dependency

## Troubleshooting

### Email not sending

1. **Check environment variables** - Ensure all SMTP variables are set
2. **Verify SMTP credentials** - Test with your provider's documentation
3. **Check firewall/network** - Port 587 must be open
4. **Review logs** - Check console for error messages
5. **Test SMTP connection** - Use a tool like telnet or an SMTP tester

### Email goes to spam

1. **Set up SPF records** for your domain
2. **Set up DKIM** with your SMTP provider
3. **Verify sender domain** with your SMTP provider
4. **Use a professional "from" address** (no-reply@yourdomain.com)

### Wrong frontend URL

- Update `FRONTEND_URL` in `.env` to match your deployment
- For production: `https://cloud-xl.vercel.app`
- For local dev: `http://localhost:5173`

## Security Notes

- Never commit `.env` file with real credentials
- Use environment variables in production (Vercel, Heroku, etc.)
- Rotate SMTP credentials regularly
- Use app-specific passwords for Gmail
- Consider rate limiting invitation endpoints
