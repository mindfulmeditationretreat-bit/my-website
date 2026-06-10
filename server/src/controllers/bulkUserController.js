const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');
const { db } = require('../lib/db');
const { users, subscriptions } = require('../db/schema');
const { sendMail } = require('../lib/mailer');

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        fields.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function normalize(row) {
  const get = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    return '';
  };
  return {
    email:         get('email', 'e_mail', 'email_address'),
    fullName:      get('full_name', 'fullname', 'name'),
    address:       get('address'),
    phone:         get('phone', 'phone_number', 'mobile'),
    program:       get('interested_program', 'program', 'interested_programs'),
    travelCountry: get('interested_country_to_travel', 'travel_country', 'country_to_travel', 'interested_country'),
  };
}

async function bulkCreateUsers(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file required' });

    const text = req.file.buffer.toString('utf8');
    const rows = parseCSV(text);
    if (!rows.length) return res.status(400).json({ message: 'CSV has no data rows' });

    const allPrograms = await db.query.programs.findMany({ where: (t, { eq }) => eq(t.active, true) });

    const results = [];

    for (const raw of rows) {
      const { email, fullName, address, phone, program: programName, travelCountry } = normalize(raw);

      if (!email) {
        results.push({ email: '(missing)', status: 'skipped', reason: 'No email in row' });
        continue;
      }

      const existing = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, email) });
      if (existing) {
        results.push({ email, status: 'skipped', reason: 'Email already exists' });
        continue;
      }

      const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const [{ id }] = await db.insert(users).values({
        email,
        passwordHash,
        fullName:     fullName || null,
        address:      address  || null,
        phone:        phone    || null,
        travelCountry: travelCountry || null,
        role:         'user',
        onboarded:    !!fullName,
        emailVerified: true,
        updatedAt:    new Date(),
      }).$returningId();
      const user = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, id) });

      let enrolledProgram = null;
      if (programName) {
        const match = allPrograms.find((p) =>
          p.name.toLowerCase().includes(programName.toLowerCase()) ||
          programName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (match) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + match.trialDays);
          await db.insert(subscriptions).values({
            userId:      user.id,
            programId:   match.id,
            status:      'trialing',
            trialEndsAt: trialEnd,
            updatedAt:   new Date(),
          });
          enrolledProgram = match.name;
        }
      }

      let emailSent = false;
      try {
        const mailResult = await sendMail({
          to: email,
          subject: 'Your Mindful account',
          title: 'Welcome to Mindful',
          html: `
            <p>Hello${fullName ? ` ${fullName}` : ''},</p>
            <p>An account has been created for you on Mindful — your premium wellness platform.</p>
            <p>
              <strong>Email:</strong> ${email}<br/>
              <strong>Temporary password:</strong> <code style="color:#e1b368;font-size:16px">${tempPassword}</code>
            </p>
            ${enrolledProgram ? `<p>You have been enrolled in <strong>${enrolledProgram}</strong> with a free trial.</p>` : ''}
            <p>Please log in and change your password at your earliest convenience.</p>
            <p><a href="${process.env.CLIENT_ORIGIN}/login" style="color:#e1b368;font-size:16px">Log in to Mindful →</a></p>
          `,
        });
        emailSent = !mailResult?.dev;
      } catch (e) {
        console.error('[bulk] email failed for', email, e.message);
      }

      results.push({
        email,
        fullName: fullName || '—',
        status: 'created',
        tempPassword,
        enrolledProgram: enrolledProgram || null,
        emailSent,
      });
    }

    const created = results.filter((r) => r.status === 'created').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    res.json({ created, skipped, total: rows.length, results });
  } catch (err) { next(err); }
}

module.exports = { bulkCreateUsers };
