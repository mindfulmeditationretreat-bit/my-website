const nodemailer = require('nodemailer');
const fs = require('fs');

let transporter = null;
let sendmailTransporter = null;

function isGmailHost(host) {
  return /gmail\.com$/i.test(String(host || '').trim());
}

function humanizeSmtpError(err) {
  const msg = err?.message || String(err);
  if (/altnames|certificate|CERT_|SSL|TLS/i.test(msg)) {
    return 'SMTP TLS failed on this host. On cPanel use your mailbox SMTP (mail.yourdomain.com) or set SMTP_SENDMAIL=true.';
  }
  return msg;
}

function findSendmailPath() {
  if (process.env.SENDMAIL_PATH) return process.env.SENDMAIL_PATH;
  const candidates = ['/usr/sbin/sendmail', '/usr/lib/sendmail', '/sbin/sendmail'];
  return candidates.find((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  }) || null;
}

function getSendmailTransporter() {
  if (sendmailTransporter) return sendmailTransporter;
  const path = findSendmailPath();
  if (!path) return null;
  sendmailTransporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path,
  });
  return sendmailTransporter;
}

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    console.warn('[mailer] SMTP not configured — emails will be logged to console only');
    return null;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  const host = process.env.SMTP_HOST.trim();
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Gmail: use well-known service config (works locally / unrestricted networks)
  if (isGmailHost(host)) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: user ? { user, pass } : undefined,
    });
    return transporter;
  }

  // Custom / cPanel SMTP
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth: user ? { user, pass } : undefined,
    tls: {
      servername: host,
      minVersion: 'TLSv1.2',
    },
  });
  return transporter;
}

async function sendViaResend({ to, subject, html, from }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Resend failed: ${res.status}`);
  }
  return { messageId: data.id, provider: 'resend' };
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
        <tr><td class="sp" align="center" style="padding:38px 40px 0">
          <span style="font-family:Georgia,'Times New Roman',serif;color:${COLORS.gold};font-size:13px;font-weight:bold;letter-spacing:6px;text-transform:uppercase">MINDFUL</span>
        </td></tr>
        <tr><td class="sp" align="center" style="padding:26px 40px 0">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:27px;line-height:1.25;color:${COLORS.cream}">${title}</h1>
        </td></tr>
        <tr><td class="sp" style="padding:22px 40px 0">
          <div style="height:1px;background-color:rgba(225,179,104,0.3);line-height:1px;font-size:0">&nbsp;</div>
        </td></tr>
        <tr><td class="sp" style="padding:22px 40px 6px;font-family:Helvetica,Arial,sans-serif;color:${COLORS.cream};font-size:15px;line-height:1.7">
          ${html}
        </td></tr>
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
  const from = process.env.SMTP_FROM || 'Mindful <no-reply@mindful.local>';
  const payload = { from, to, subject, html: body };

  // 1) Resend HTTPS — works when outbound SMTP is blocked/MITM'd on shared hosting
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend({ to, subject, html: body, from });
    } catch (e) {
      console.error('[mailer] Resend failed', e.message);
      // fall through to SMTP / sendmail
    }
  }

  // 2) Prefer sendmail on cPanel when explicitly enabled
  const preferSendmail = process.env.SMTP_SENDMAIL === 'true' || process.env.SMTP_SENDMAIL === '1';
  if (preferSendmail) {
    const sm = getSendmailTransporter();
    if (sm) {
      return sm.sendMail(payload);
    }
  }

  // 3) SMTP
  const t = getTransporter();
  if (t) {
    try {
      return await t.sendMail(payload);
    } catch (e) {
      console.error('[mailer] SMTP failed', e.message);
      // 4) Auto-fallback to local sendmail (common on cPanel)
      const sm = getSendmailTransporter();
      if (sm) {
        console.warn('[mailer] Falling back to sendmail');
        try {
          return await sm.sendMail(payload);
        } catch (e2) {
          console.error('[mailer] sendmail failed', e2.message);
        }
      }
      throw new Error(humanizeSmtpError(e));
    }
  }

  if (!preferSendmail) {
    const sm = getSendmailTransporter();
    if (sm) {
      return sm.sendMail(payload);
    }
  }

  console.log('[mailer:DEV]', { to, subject, preview: html.replace(/<[^>]+>/g, '').slice(0, 200) });
  return { dev: true };
}

const templates = {
  welcomeInstructor: (name) => ({
    subject: 'Welcome to Mindful — You\'re approved!',
    title: `Welcome, ${name || 'Provider'}.`,
    html: `<p style="margin:0 0 18px;text-align:center">Great news — your provider account has been <strong style="color:${COLORS.gold}">verified and approved</strong> by our team.</p>
           <p style="margin:0 0 22px;text-align:center;color:rgba(255,235,203,0.7)">You can now log in and start supporting members on their wellness journey.</p>
           ${button(`${process.env.CLIENT_ORIGIN}/login`, 'Log in as Provider')}`,
  }),
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
