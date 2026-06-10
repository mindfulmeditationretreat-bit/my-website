const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { prisma } = require('./lib/prisma');

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
        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId: profile.id }, { email }] },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              googleId: profile.id,
              fullName: profile.displayName || null,
              photoUrl: profile.photos?.[0]?.value || null,
              emailVerified: true,
              role: 'user',
            },
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id, emailVerified: true },
          });
        }
        done(null, user);
      } catch (err) { done(err); }
    }
  ));

  passport.serializeUser((user, cb) => cb(null, user.id));
  passport.deserializeUser(async (id, cb) => {
    const user = await prisma.user.findUnique({ where: { id } });
    cb(null, user);
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

module.exports = { setupPassport };
