const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { db } = require('./lib/db');
const { users } = require('./db/schema');
const { eq, or } = require('drizzle-orm');

function setupPassport(app) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[passport] Google OAuth not configured — /api/auth/google will return 503');
    return;
  }
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ORIGIN || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email returned from Google'));
        let user = await db.query.users.findFirst({
          where: (t, { or: o, eq: e }) => o(e(t.googleId, profile.id), e(t.email, email)),
        });
        if (!user) {
          const [result] = await db.insert(users).values({
            email,
            googleId: profile.id,
            fullName: profile.displayName || null,
            photoUrl: profile.photos?.[0]?.value || null,
            emailVerified: true,
            role: 'user',
          }).$returningId();
          user = await db.query.users.findFirst({ where: (t, { eq: e }) => e(t.id, result.id) });
        } else if (!user.googleId) {
          await db.update(users).set({ googleId: profile.id, emailVerified: true }).where(eq(users.id, user.id));
          user = await db.query.users.findFirst({ where: (t, { eq: e }) => e(t.id, user.id) });
        }
        done(null, user);
      } catch (err) { done(err); }
    }
  ));

  passport.serializeUser((user, cb) => cb(null, user.id));
  passport.deserializeUser(async (id, cb) => {
    try {
      const user = await db.query.users.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
      cb(null, user);
    } catch (err) { cb(err); }
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

module.exports = { setupPassport };
