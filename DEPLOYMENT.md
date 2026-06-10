# Mindful — Setup & Deployment

## Local development

### 1. Database
```bash
# Create MySQL database (any 8+ instance, local Docker, or Hostinger)
mysql -u root -p -e "CREATE DATABASE mindful;"
```

### 2. Server
```powershell
cd server
copy .env.example .env
# Edit .env — at minimum set DATABASE_URL, JWT_SECRET, SESSION_SECRET
npm install
npm run db:migrate    # name the first migration "init"
npm run db:seed       # creates admin + 3 instructors + 3 programs
npm run dev           # http://localhost:5000
```

**Default seeded accounts (CHANGE PASSWORDS IMMEDIATELY):**
- Admin: `admin@mindful.local` / `admin12345`
- Instructors: `dietician@mindful.local`, `meditation@mindful.local`, `counselor@mindful.local` — all use `instructor12345`

### 3. Client
```powershell
cd client
copy .env.local.example .env.local
npm install
npm run dev           # http://localhost:3000
```

## Third-party credentials

All optional integrations skip gracefully when env vars are missing — features will simply be unavailable (or fall back to logging-only). Fill these in `server/.env` to enable:

### Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback` (dev) and `https://yourdomain.com/api/auth/google/callback` (prod)
4. Set in `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### SMTP (transactional email)
- **Dev:** use https://mailtrap.io — they give SMTP creds with `smtp.mailtrap.io:2525`
- **Prod (Hostinger):** `smtp.hostinger.com:465`, your email + password

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=your-mailbox-password
SMTP_FROM="Mindful <no-reply@yourdomain.com>"
```

Without SMTP, the server logs emails to console instead of sending — useful for dev.

### eSewa payments (placeholder)
The `/api/payments/esewa/*` routes are stubbed. Wire up per https://developer.esewa.com.np/ when you're ready to go live, then set:
```
ESEWA_MERCHANT_ID=...
ESEWA_SECRET_KEY=...
```

## Hostinger deployment

### Database (MySQL)
1. In hPanel → **Databases → MySQL Databases**, create a database + user, grant all privileges.
2. Note the host, db name, user, password.
3. Set `DATABASE_URL` in production env: `mysql://USER:PASS@HOST:3306/DBNAME`.

### Backend (Node.js on Hostinger)
Hostinger supports Node.js on Business plans+. From hPanel → **Advanced → Node.js**:
1. Create a new app, point at `/server`, set startup file to `src/index.js`, Node version ≥ 18.
2. Upload code (or git clone via SSH).
3. SSH in and run:
   ```bash
   cd ~/domains/yourdomain.com/server
   npm ci --production
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed      # only the first time
   ```
4. Set env vars in hPanel's Node.js app settings (DATABASE_URL, JWT_SECRET, SESSION_SECRET, CLIENT_ORIGIN=https://yourdomain.com, SERVER_ORIGIN=https://api.yourdomain.com, NODE_ENV=production, plus optional SMTP/Google).
5. Start the app.

### Frontend (Next.js)
Two options:

**A. Same host, Node.js app** (Hostinger Business+):
- Create a second Node.js app pointing at `/client`, startup script `node node_modules/next/dist/bin/next start`.
- Build first: `npm ci && npm run build`.
- Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`.

**B. Static export + Hostinger shared hosting**: not recommended — the dashboards use server components that need a Node runtime.

### SSL + Domain
- Point your A record to Hostinger's IP.
- Enable Let's Encrypt SSL in hPanel for both `yourdomain.com` and `api.yourdomain.com`.

### File uploads → S3 (recommended for prod)
The default uses local disk at `server/uploads/`. For Hostinger you can keep this (uploads persist between deploys if you store them outside the deploy dir), but better:
- Add `aws-sdk` to server, swap `multer-s3` for `multer.diskStorage` in `server/src/middleware/upload.js`.
- Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` env vars.

### Backups
In hPanel → **Files → Backups**, enable daily backups (Premium+). Or schedule a cron:
```bash
0 3 * * * mysqldump -u USER -pPASS mindful > /home/USER/backups/mindful-$(date +\%F).sql
```

### Process management
Use Hostinger's built-in process manager, or PM2:
```bash
npm i -g pm2
pm2 start src/index.js --name mindful-api
pm2 startup && pm2 save
```

## Security checklist before going live

- [ ] Change admin & instructor seed passwords
- [ ] Generate strong `JWT_SECRET` and `SESSION_SECRET` (≥ 64 chars)
- [ ] Set `NODE_ENV=production` (forces secure cookies)
- [ ] HTTPS for both API and frontend (cookies require it in prod)
- [ ] Configure SMTP so password-reset / verification actually delivers
- [ ] Set up automated DB backups
- [ ] Lock down DB user to least privilege
- [ ] Review CORS `CLIENT_ORIGIN` is the exact production URL
- [ ] Set up monitoring (Hostinger has uptime monitoring, or use BetterStack/UptimeRobot)

## Known stubs / to-do

- **Google OAuth** — works once you supply credentials, untested live
- **SMTP** — same, falls back to console logging
- **eSewa payment** — endpoints are placeholders; real signed-form integration needed
- **File uploads** — Cloudinary when `CLOUDINARY_*` env vars are set; falls back to local disk
- **Real-time messaging** — Socket.io (wired); ensure your host allows WebSocket connections
- **Email templates** — single brand layout; consider MJML for design polish
- **Mobile/responsive QA** — Tailwind responsive classes are in place but each page should be smoke-tested on a real device

## Cron jobs (already wired)

The server starts `node-cron` automatically on boot. Currently scheduled:
- **Hourly:** expire trials whose `trialEndsAt` has passed; notify users whose trial ends in ≤ 2 days (once)

If you run multiple server instances behind a load balancer, move cron to a dedicated worker process to avoid duplicate firing.
