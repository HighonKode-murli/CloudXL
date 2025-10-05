export function inviteEmailTemplate({ teamName, profile, inviteLink, inviterEmail }) {
  const subject = `Invitation to join ${teamName} on CloudXL`;
  
  const text = `Hello,

${inviterEmail} invited you to join the "${teamName}" team as "${profile}" on CloudXL.

Join here: ${inviteLink}

If the button/link doesn't work, copy and paste the URL into your browser.

If you didn't expect this invitation, you can safely ignore this email.`;

  const html = `
<div style="font-family: Arial, sans-serif; line-height:1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Invitation to join ${teamName}</h2>
  <p>${inviterEmail} invited you to join the team as <b>${profile}</b> on CloudXL.</p>
  <p style="margin: 30px 0;">
    <a href="${inviteLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block;">
      Join Team
    </a>
  </p>
  <p>Or open this link: <br><a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a></p>
  <p style="color: #666; font-size: 14px; margin-top: 40px;">If you didn't expect this, you can ignore this email.</p>
</div>`;

  return { subject, text, html };
}
