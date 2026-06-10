const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function parseCookies(str) {
  const out = {};
  (str || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    // Allow cookie-based auth on cross-origin handshake
    allowRequest: (req, callback) => callback(null, true),
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      socket.userId = payload.id;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins their own private room
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
