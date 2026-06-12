require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const { setupPassport } = require('./passport');
const { startCron } = require('./lib/cron');
const { initSocket } = require('./lib/socket');
const { generalLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const programRoutes = require('./routes/programRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', domain: process.env.COOKIE_DOMAIN || undefined },
}));

setupPassport(app);
initSocket(httpServer);

app.use(generalLimiter);

app.use('/uploads', express.static(path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/providers', instructorRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCron();
});
