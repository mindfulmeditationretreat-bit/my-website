const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');
const schema = require('./schema');

function buildConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const u = new URL(url);
      // Force 127.0.0.1 — on Linux, 'localhost' triggers a socket attempt
      const host = (u.hostname === 'localhost') ? '127.0.0.1' : u.hostname;
      return {
        host,
        port: parseInt(u.port) || 3306,
        user: u.username || 'root',
        password: u.password || undefined,
        database: u.pathname.replace(/^\//, '') || 'mindful',
        socketPath: process.env.DB_SOCKET || undefined,
        waitForConnections: true,
        connectionLimit: 10,
      };
    } catch {}
  }
  return {
    host:             process.env.DB_HOST     || '127.0.0.1',
    port:             parseInt(process.env.DB_PORT) || 3306,
    user:             process.env.DB_USER     || 'root',
    password:         process.env.DB_PASSWORD || undefined,
    database:         process.env.DB_NAME     || 'mindful',
    socketPath:       process.env.DB_SOCKET   || undefined,
    waitForConnections: true,
    connectionLimit:  10,
  };
}

const pool = mysql.createPool(buildConfig());
const db = drizzle(pool, { schema, mode: 'default' });

module.exports = { db };
