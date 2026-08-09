require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const url = process.env.DATABASE_URL;
  const u = new URL(url);
  const conn = await mysql.createConnection({
    host: u.hostname === 'localhost' ? '127.0.0.1' : u.hostname,
    port: Number(u.port) || 3306,
    user: u.username || 'root',
    password: u.password || undefined,
    database: u.pathname.replace(/^\//, '') || 'mindful',
    multipleStatements: true,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`_migrations\` (
      \`id\` VARCHAR(36) NOT NULL,
      \`checksum\` VARCHAR(64) NOT NULL,
      \`finished_at\` DATETIME(3) NULL,
      \`migration_name\` VARCHAR(255) NOT NULL,
      \`logs\` TEXT NULL,
      \`rolled_back_at\` DATETIME(3) NULL,
      \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`applied_steps_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  const dir = path.join(__dirname, 'migrations');
  const folders = fs.readdirSync(dir).filter((n) => fs.statSync(path.join(dir, n)).isDirectory()).sort();
  for (const name of folders) {
    const sqlFile = path.join(dir, name, 'migration.sql');
    if (!fs.existsSync(sqlFile)) continue;
    const [rows] = await conn.query(
      'SELECT COUNT(*) AS c FROM `_migrations` WHERE migration_name=? AND finished_at IS NOT NULL',
      [name]
    );
    if (rows[0].c > 0) {
      console.log('✓', name, '(already applied)');
      continue;
    }
    console.log('→', name);
    const sql = fs.readFileSync(sqlFile, 'utf8');
    try {
      await conn.query(sql);
    } catch (e) {
      console.warn('  warn:', e.message);
    }
    await conn.query(
      `INSERT INTO \`_migrations\` (id, checksum, migration_name, finished_at, applied_steps_count)
       VALUES (UUID(), 'manual', ?, NOW(3), 1)`,
      [name]
    );
    console.log('✓', name, 'applied');
  }
  await conn.end();
  console.log('Done');
}

main().catch((e) => { console.error(e); process.exit(1); });
