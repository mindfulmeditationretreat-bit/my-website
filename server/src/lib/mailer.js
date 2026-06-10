const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    console.warn('[mailer] SMTP not configured — emails will be logged to console only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

// ── Brand palette (mirrors the app's Tailwind theme) ──
const COLORS = {
  gold: '#e1b368',
  cream: '#ffebcb',
  bg: '#050505',
  card: '#0c0a07',
  line: 'rgba(225,179,104,0.18)',
};

// Gold pill button (matches the app's .btn-primary). Bulletproof, table-based.
function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:6px auto 0">
    <tr><td align="center" bgcolor="${COLORS.gold}" style="border-radius:999px">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:13px 32px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#000000;text-decoration:none;border-radius:999px">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

function brand(html, title) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en" style="background-color:${COLORS.bg}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    html, body { margin:0 !important; padding:0 !important; width:100% !important; background-color:${COLORS.bg} !important; }
    /* Stop iOS/Gmail from auto-recoloring our palette */
    a { color:${COLORS.gold}; }
    @media only screen and (max-width:600px) {
      .sp { padding-left:24px !important; padding-right:24px !important; }
    }
  </style>
</head>
<body bgcolor="${COLORS.bg}" style="margin:0;padding:0;width:100%;background-color:${COLORS.bg}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.bg}" style="width:100%;background-color:${COLORS.bg}">
    <tr><td align="center" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg};padding:40px 16px">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.card}" style="max-width:560px;background-color:${COLORS.card};border:1px solid ${COLORS.line};border-radius:18px">
        <!-- Wordmark -->
        <tr><td class="sp" align="center" style="padding:38px 40px 0">
          <span style="font-family:Georgia,'Times New Roman',serif;color:${COLORS.gold};font-size:13px;font-weight:bold;letter-spacing:6px;text-transform:uppercase">MINDFUL</span>
        </td></tr>
        <!-- Title -->
        <tr><td class="sp" align="center" style="padding:26px 40px 0">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:27px;line-height:1.25;color:${COLORS.cream}">${title}</h1>
        </td></tr>
        <!-- Divider -->
        <tr><td class="sp" style="padding:22px 40px 0">
          <div style="height:1px;background-color:rgba(225,179,104,0.3);line-height:1px;font-size:0">&nbsp;</div>
        </td></tr>
        <!-- Body -->
        <tr><td class="sp" style="padding:22px 40px 6px;font-family:Helvetica,Arial,sans-serif;color:${COLORS.cream};font-size:15px;line-height:1.7">
          ${html}
        </td></tr>
        <!-- Footer -->
        <tr><td class="sp" style="padding:26px 40px 36px">
          <div style="height:1px;background-color:rgba(225,179,104,0.12);line-height:1px;font-size:0;margin-bottom:18px">&nbsp;</div>
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;color:rgba(255,235,203,0.5);font-size:12px;line-height:1.6;text-align:center">
            Mindful · Premium Wellness<br>
            This is an automated message — please don't reply.
          </p>
        </td></tr>
      </table>

      <p style="max-width:560px;margin:18px auto 0;font-family:Helvetica,Arial,sans-serif;color:rgba(255,235,203,0.35);font-size:11px;text-align:center">
        © ${year} Mindful. All rights reserved.
      </p>

    </td></tr>
  </table>
</body>
</html>`;
}

async function sendMail({ to, subject, title, html }) {
  const body = brand(html, title || subject);
  const t = getTransporter();
  if (!t) {
    console.log('[mailer:DEV]', { to, subject, preview: html.replace(/<[^>]+>/g, '').slice(0, 200) });
    return { dev: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || 'Mindful <no-reply@mindful.local>',
    to,
    subject,
    html: body,
  });
}

const templates = {
  welcome: (name) => ({
    subject: 'Welcome to Mindful',
    title: `Welcome, ${name || 'friend'}.`,
    html: `<p style="margin:0 0 22px">Thank you for joining Mindful. Your journey toward calmer, healthier living starts now.</p>
           ${button(`${process.env.CLIENT_ORIGIN}/dashboard`, 'Open your dashboard')}`,
  }),
  accountCreated: (email, tempPassword) => ({
    subject: 'Your Mindful account is ready',
    title: 'Welcome to Mindful',
    html: `<p style="margin:0 0 20px;text-align:center">An account has been created for you. Sign in with the credentials below.</p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;border:1px solid rgba(225,179,104,0.3);border-radius:14px;margin:0 0 22px">
             <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(225,179,104,0.12)">
               <span style="display:block;color:rgba(255,235,203,0.45);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Email</span>
               <span style="color:${COLORS.cream};font-size:15px">${email}</span>
             </td></tr>
             <tr><td style="padding:16px 20px">
               <span style="display:block;color:rgba(255,235,203,0.45);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Temporary password</span>
               <span style="color:${COLORS.gold};font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:bold;letter-spacing:1px">${tempPassword}</span>
             </td></tr>
           </table>
           ${button(`${process.env.CLIENT_ORIGIN}/login`, 'Log in to Mindful')}
           <p style="margin:22px 0 0;color:rgba(255,235,203,0.45);font-size:13px;line-height:1.6;text-align:center">For your security, please change your password after your first login.</p>`,
  }),
  verifyEmail: (link) => ({
    subject: 'Verify your email',
    title: 'Confirm your email',
    html: `<p style="margin:0 0 22px;text-align:center">Please confirm your email address to finish setting up your account.</p>
           ${button(link, 'Verify email')}
           <p style="margin:22px 0 0;color:rgba(255,235,203,0.45);font-size:13px;line-height:1.6;text-align:center">This link expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>`,
  }),
  passwordReset: (link) => ({
    subject: 'Reset your password',
    title: 'Password reset',
    html: `<p style="margin:0 0 22px">Use the button below to choose a new password.</p>
           ${button(link, 'Reset password')}
           <p style="margin:22px 0 0;color:rgba(255,235,203,0.45);font-size:13px;line-height:1.6;text-align:center">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  }),
  trialStarted: (programName, days) => ({
    subject: `Your ${programName} trial has begun`,
    title: `${programName} · trial started`,
    html: `<p style="margin:0 0 22px">Your ${days}-day free trial is now active. Enjoy full access to all premium content.</p>
           ${button(`${process.env.CLIENT_ORIGIN}/dashboard/programs`, 'Go to my programs')}`,
  }),
  trialEnding: (programName, daysLeft) => ({
    subject: `Your ${programName} trial ends in ${daysLeft} day(s)`,
    title: 'Your trial is ending soon',
    html: `<p style="margin:0 0 22px">Your ${programName} trial ends in ${daysLeft} day(s). Subscribe to keep your premium access.</p>
           ${button(`${process.env.CLIENT_ORIGIN}/dashboard/programs`, 'Manage subscription')}`,
  }),
  subscriptionSuccess: (programName) => ({
    subject: `Subscription confirmed — ${programName}`,
    title: 'Subscription confirmed',
    html: `<p>You're now a full member of ${programName}. Welcome aboard.</p>`,
  }),
  paymentReceipt: (programName, amount) => ({
    subject: 'Payment receipt',
    title: 'Thank you for your payment',
    html: `<p>We've received your payment of ${amount} for ${programName}.</p>`,
  }),
  notification: (title, body) => ({
    subject: title,
    title,
    html: `<p>${body}</p>`,
  }),
};

module.exports = { sendMail, templates, brand };
