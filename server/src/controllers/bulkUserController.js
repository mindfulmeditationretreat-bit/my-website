const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');

// Simple CSV parser — handles quoted fields containing commas
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

// Map fuzzy column names coming from the CSV
function normalize(row) {
  // Try multiple possible header variants
  const get = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    return '';
  };
  return {
    email:          get('email', 'e_mail', 'email_address'),
    fullName:       get('full_name', 'fullname', 'name'),
    address:        get('address'),
    phone:          get('phone', 'phone_number', 'mobile'),
    program:        get('interested_program', 'program', 'interested_programs'),
    travelCountry:  get('interested_country_to_travel', 'travel_country', 'country_to_travel', 'interested_country'),
  };
}

async function bulkCreateUsers(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file required' });

    const text = req.file.buffer.toString('utf8');
    const rows = parseCSV(text);
    if (!rows.length) return res.status(400).json({ message: 'CSV has no data rows' });

    // Load all programs once for matching
    const programs = await prisma.program.findMany({ where: { active: true } });

    const results = [];

    for (const raw of rows) {
      const { email, fullName, address, phone, program: programName, travelCountry } = normalize(raw);

      if (!email) {
        results.push({ email: '(missing)', status: 'skipped', reason: 'No email in row' });
        continue;
      }

      // Skip duplicates
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.push({ email, status: 'skipped', reason: 'Email already exists' });
        continue;
      }

      const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName:     fullName || null,
          address:      address  || null,
          phone:        phone    || null,
          travelCountry: travelCountry || null,
          role:         'user',
          onboarded:    !!fullName,
          emailVerified: true,
        },
      });

      // Try to match and enrol in a program
      let enrolledProgram = null;
      if (programName) {
        const match = programs.find((p) =>
          p.name.toLowerCase().includes(programName.toLowerCase()) ||
          programName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (match) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + match.trialDays);
          await prisma.subscription.create({
            data: {
              userId:      user.id,
              programId:   match.id,
              status:      'trialing',
              trialEndsAt: trialEnd,
            },
          });
          enrolledProgram = match.name;
        }
      }

      // Send welcome email
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
