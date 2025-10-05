import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports like 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates (for development)
  }
});

export async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html
  });
  return { messageId: info.messageId };
}
