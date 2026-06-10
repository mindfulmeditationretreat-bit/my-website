# Mindful — Premium Wellness Platform

Holistic wellness web app: dietician services, meditation & yoga, and wellness counseling.

**Stack:** Next.js 14 (App Router) · Express · Prisma · MySQL · Tailwind · Passport (Google OAuth) · Nodemailer · node-cron

```
mindfull/
├── client/    # Next.js frontend
├── server/    # Express + Prisma API
└── DEPLOYMENT.md
```

## Quick start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup. TL;DR:

```powershell
# 1. Create MySQL database "mindful"

# 2. Server
cd server
copy .env.example .env    # fill DATABASE_URL, JWT_SECRET, SESSION_SECRET
npm install
npm run db:migrate        # name it "init"
npm run db:seed
npm run dev               # :5000

# 3. Client
cd client
copy .env.local.example .env.local
npm install
npm run dev               # :3000
```

**Seeded login:** `admin@mindful.local` / `admin12345` (change immediately)

## Features

- Auth: email/password + Google OAuth (httpOnly JWT cookies, bcrypt)
- Email verification + password reset
- 3-role RBAC (user / instructor / admin)
- First-time onboarding (wellness goals)
- Programs + 14-day free trials with automatic expiry (cron)
- Instructor assignment per subscription
- Messaging between users and their assigned instructor
- Resource library (PDF/video/audio/image/article) with free vs premium gating
- Progress tracking (weight / meditation / mood)
- In-app + email notifications
- Admin: user/instructor/program CRUD, subscriptions, analytics, broadcasts
- Brand theme (#e1b368 gold on #000 ink, cream #ffebcb), serif headings
- Security: helmet, rate limiting, CORS, SQL injection protection (Prisma), session management
- eSewa payment placeholder (deferred per spec)
