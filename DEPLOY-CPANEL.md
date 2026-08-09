# Mindful — Deploy on cPanel (from zero)

This guide assumes you have:

- A **fresh cPanel** account (SSH available)
- This project on **GitHub**
- A **MySQL database** already created, imported, and a DB user with access
- **No** env files on the server yet

You do **not** need Hostinger or hPanel. Everything here is plain **cPanel + GitHub Actions + SSH**.

---

## Big picture

You run **two Node apps** on the same cPanel account:

| App | Code folder on GitHub | Typical folder on server | Job |
|-----|----------------------|-------------------------|-----|
| **API** (Express) | `server/` | `~/api` | Talks to MySQL, auth, uploads, emails |
| **Website** (Next.js) | `client/` | `~/nextjs` | Pages users see in the browser |

**Automatic deploy:** when you push to the `main` branch on GitHub:

- Changes under `server/` → workflow **Deploy Backend to cPanel** runs  
- Changes under `client/` → workflow **Deploy Frontend to cPanel** runs  
- You can also start either workflow by hand: GitHub → **Actions** → pick workflow → **Run workflow**

Flow:

```text
You push to main
    → GitHub Actions builds / packages
    → SSH into your cPanel server
    → Uploads files + writes .env
    → npm install / restarts with PM2
```

---

## Step 0 — Decide your URLs

Pick real domains (examples — use yours):

| Role | Example URL |
|------|-------------|
| Website | `https://yourdomain.com` |
| API | `https://api.yourdomain.com` |
| Cookie domain | `.yourdomain.com` (leading dot so login works on both) |

In cPanel:

1. Add the main domain (or use the one already assigned).
2. Create subdomain **`api`** → `api.yourdomain.com`.
3. Enable **SSL** (Let’s Encrypt / AutoSSL) for **both**.

You will point each hostname at the matching Node app later (Step 4).

---

## Step 1 — Turn on SSH and prepare folders

1. cPanel → **SSH Access** → enable SSH, add your public key if asked.
2. Connect (replace user/host/port):

```bash
ssh -p 22 YOUR_CPANEL_USER@YOUR_SERVER_HOST
```

3. Create deploy folders:

```bash
mkdir -p ~/api ~/nextjs ~/npm-global ~/uploads-api
```

4. Install **PM2** (keeps Node apps running after deploy):

```bash
npm config set prefix ~/npm-global
npm install -g pm2
echo 'export PATH=$HOME/npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

which node
which pm2
# Example answers:
# /opt/alt/alt-nodejs20/root/usr/bin/node
# /home/YOURUSER/npm-global/bin/pm2
```

Write those two paths down — optional GitHub secrets `NODE_BIN` and `PM2_BIN` if auto-detect fails.

5. Put your SSH **public** key in `~/.ssh/authorized_keys` so GitHub Actions can log in with the **private** key (see Step 2).

---

## Step 2 — Create an SSH key for GitHub → cPanel

On your **laptop** (or any safe machine):

```bash
ssh-keygen -t ed25519 -C "github-deploy-mindful" -f ./cpanel_deploy -N ""
```

- `cpanel_deploy.pub` → paste into cPanel `~/.ssh/authorized_keys` (one line).  
- `cpanel_deploy` (private, no `.pub`) → entire file becomes GitHub secret `CPANEL_SSH_KEY`.

Never commit the private key to the repo.

Test from your laptop:

```bash
ssh -i ./cpanel_deploy -p YOUR_SSH_PORT YOUR_CPANEL_USER@YOUR_SERVER_HOST "echo ok"
```

---

## Step 3 — Database connection string

### This project (cPanel MySQL)

| Field | Value |
|-------|--------|
| MySQL user | `mindful1_ason` |
| Database | `mindful1_mindful` |
| Host | `localhost` |
| Port | `3306` |

**GitHub Actions secret `DATABASE_URL`** (paste exactly; do **not** commit this to git if the repo is public):

```text
mysql://mindful1_ason:mindful12345@localhost:3306/mindful1_mindful
```

If you change the DB password in cPanel later, update this secret to match.  
If a new password has special characters (`@`, `#`, `/`, etc.), URL-encode them (e.g. `@` → `%40`).

You already imported the DB. After the first API deploy (or over SSH), still run migrations if the dump is older than the latest code:

```bash
cd ~/api
node db/migrate.js
# only if you need demo admin/programs and DB has none:
# node db/seed.js
```

The GitHub API workflow also runs `migrate.js` automatically when migration files change.

---

## Step 4 — Wire domains to Node (cPanel)

Use **Setup Node.js App** (or your host’s Node selector):

### API app
- Application root: something that serves `~/api` (or proxy to port `5050`)
- Startup file: `src/index.js`
- Node version: **18 or 20**
- Port: **5050** (must match `API_PORT` / `.env`)

### Frontend app
- Application root: `~/nextjs` (standalone build lands here after Actions)
- Startup: `server.js` (Next standalone)
- Port: **3000** (or your `FRONTEND_PORT`)

Exact UI labels differ by host, but the idea is:

- `yourdomain.com` → frontend Node process  
- `api.yourdomain.com` → API Node process  

If the host only “attaches” a domain to a Node app, do that for both.  
If you use PM2 only, configure reverse proxy / passenger / “Application URL” so public HTTPS reaches those ports.

---

## Step 5 — GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

### Required (deploy will fail without these)

| Secret name | What it is | Example |
|-------------|------------|---------|
| `CPANEL_HOST` | Server hostname or IP for SSH | `server.example.com` |
| `CPANEL_SSH_PORT` | SSH port | `22` |
| `CPANEL_USERNAME` | cPanel username | `myuser` |
| `CPANEL_SSH_KEY` | Full private key PEM (including `BEGIN` / `END` lines) | *(paste key file)* |
| `DATABASE_URL` | MySQL URL | `mysql://mindful1_ason:mindful12345@localhost:3306/mindful1_mindful` |
| `JWT_SECRET` | Random long string (login tokens) | see `server/.env.production.example` |
| `SESSION_SECRET` | Another random long string | see `server/.env.production.example` |
| `CLIENT_ORIGIN` | Public website origin (no trailing slash) | `https://yourdomain.com` |
| `SERVER_ORIGIN` | Public API origin (no trailing slash) | `https://api.yourdomain.com` |
| `COOKIE_DOMAIN` | Shared cookie domain (leading dot) | `.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Browser → API base (must end with `/api`) | `https://api.yourdomain.com/api` |

Generate secrets on your PC:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run twice → paste into `JWT_SECRET` and `SESSION_SECRET`.  
Ready-made values for this project are already in `server/.env.production.example` — copy those into GitHub secrets (or regenerate if this file ever went public).

### Production env templates in the repo

| File | Use for |
|------|---------|
| `server/.env.production.example` | API `.env` on cPanel (`~/api/.env`) **and** matching GitHub secrets |
| `client/.env.production.example` | Frontend build vars (`NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`) |

Before live: replace every `YOURDOMAIN` with your real domain in those files **and** in the GitHub secrets for origins / API URL.

### Optional (sensible defaults if omitted)

| Secret | Default / meaning |
|--------|-------------------|
| `API_PORT` | `5050` |
| `FRONTEND_PORT` | `3000` |
| `API_DIR` | `$HOME/api` |
| `FRONTEND_DIR` | `$HOME/nextjs` |
| `NODE_BIN` | Auto-detect `node` |
| `PM2_BIN` | Auto-detect `pm2` |
| `INTERNAL_API_URL` | `http://127.0.0.1:5050/api` (Next server talks to API on localhost) |
| `JWT_EXPIRES_IN` | `7d` |
| `SMTP_SENDMAIL` | `true` on API deploy (uses cPanel sendmail if present) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Real mailbox SMTP when you want email |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google login (optional) |
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT` | Cloud uploads (optional; else local `uploads/`) |

---

## Step 6 — What each workflow does

### Backend — `.github/workflows/deploy.yml`

1. Packages `server/` (skips `node_modules`, `.env`, `uploads`)  
2. Uploads to cPanel  
3. Writes `~/api/.env` from secrets  
4. `npm install --omit=dev`  
5. Runs `node db/migrate.js` if migrations changed  
6. Runs `node db/seed.js` only if `seed.js` changed  
7. Restarts PM2 app `mindfull-api`

### Frontend — `.github/workflows/deploy-frontend.yml`

1. `npm ci` in `client/`  
2. `npm run build` with `NEXT_PUBLIC_API_URL` (and optional `INTERNAL_API_URL`)  
3. Packages Next **standalone** output  
4. Uploads to `~/nextjs`  
5. Restarts PM2 app `mindfull-frontend`

Templates for local reference (not used by Actions directly):

- `server/.env.production.example`  
- `client/.env.production.example`

---

## Step 7 — First deploy

1. Confirm all **required** secrets are set.  
2. Push to `main`, **or** Actions → **Deploy Backend to cPanel** → **Run workflow**, then the frontend workflow.  
3. Open the Actions tab and wait for green checks.  
4. Test API:

```text
https://api.yourdomain.com/api/health
```

Expected: `{"status":"ok"}`

5. Open the website, try login/signup.

If you ran seed on an empty DB, default admin is in `server/db/seed.js` — **change that password immediately**.

---

## Step 8 — Email on cPanel (when you’re ready)

Shared hosting often breaks `smtp.gmail.com` (TLS certificate mismatch). Prefer:

1. **`SMTP_SENDMAIL=true`** (default in the API workflow) — uses the server’s local mailer, or  
2. Create a **cPanel email account** and set:

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=mailbox-password
SMTP_FROM="Mindful <noreply@yourdomain.com>"
SMTP_SENDMAIL=false
```

Add those as GitHub secrets and redeploy the API.

---

## Day-to-day workflow

```text
Edit code locally
  → git commit
  → git push origin main
  → GitHub Actions deploys
  → Refresh the site
```

- Only `server/` changes → only API redeploys  
- Only `client/` changes → only frontend rebuilds and redeploys  
- Both → both workflows run  

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| Actions fail on SSH | `CPANEL_HOST`, port, username, private key matches `authorized_keys` |
| API won’t start / MySQL error | `DATABASE_URL` user/pass/db name; host usually `localhost` |
| Site loads but login fails | `CLIENT_ORIGIN`, `SERVER_ORIGIN`, `COOKIE_DOMAIN`, HTTPS on both |
| Frontend can’t reach API | `NEXT_PUBLIC_API_URL` must be public `https://api…/api` |
| SSR / cookies weird on server | Set `INTERNAL_API_URL=http://127.0.0.1:5050/api` |
| PM2 missing in logs | Install PM2 (Step 1) or set `PM2_BIN`; or start apps from cPanel Node UI |
| Email TLS / cert errors | Use cPanel mailbox SMTP or `SMTP_SENDMAIL=true`, not Gmail from the server |
| Old schema missing new tables | SSH: `cd ~/api && node db/migrate.js` |

Useful SSH checks:

```bash
pm2 status
pm2 logs mindfull-api --lines 50
pm2 logs mindfull-frontend --lines 50
curl -s http://127.0.0.1:5050/api/health
```

---

## Security checklist

- [ ] Never commit `.env` or private SSH keys  
- [ ] Strong unique `JWT_SECRET` / `SESSION_SECRET`  
- [ ] Change seeded admin passwords  
- [ ] SSL on website **and** API  
- [ ] DB user only has access to this database  
- [ ] Rotate deploy SSH key if it ever leaks  

---

## Quick checklist (print this)

1. [ ] Domains + SSL (`yourdomain.com` + `api.yourdomain.com`)  
2. [ ] SSH works; `~/api` and `~/nextjs` exist; PM2 installed  
3. [ ] Deploy SSH key in `authorized_keys` + GitHub `CPANEL_SSH_KEY`  
4. [ ] MySQL ready; `DATABASE_URL` secret set  
5. [ ] All required GitHub secrets filled  
6. [ ] Push `main` or run both workflows manually  
7. [ ] `/api/health` OK → open the site  

That’s the full path from an empty cPanel to auto-deploy on every push to `main`.
