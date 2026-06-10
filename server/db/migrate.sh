#!/bin/bash
set -e

# Extract DATABASE_URL directly — avoids sourcing values with special chars
DATABASE_URL=$(grep -m1 '^DATABASE_URL=' .env | cut -d'=' -f2-)

# Parse DATABASE_URL: mysql://user:pass@host:port/dbname
DB_URL="${DATABASE_URL}"
DB_USER=$(echo "$DB_URL" | sed 's|mysql://\([^:]*\):.*|\1|')
DB_PASS=$(echo "$DB_URL" | sed 's|mysql://[^:]*:\([^@]*\)@.*|\1|')
DB_HOST=$(echo "$DB_URL" | sed 's|mysql://[^@]*@\([^:/]*\).*|\1|')
DB_PORT=$(echo "$DB_URL" | sed 's|.*:\([0-9]*\)/.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed 's|.*/\([^?]*\).*|\1|')

MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME"

echo "Running migrations on $DB_HOST:$DB_PORT/$DB_NAME"

# Create migrations tracking table if it doesn't exist
$MYSQL_CMD -e "
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
"

# Loop through all migration folders in order
for migration_dir in db/migrations/*/; do
  migration_name=$(basename "$migration_dir")

  sql_file="$migration_dir/migration.sql"
  if [ ! -f "$sql_file" ]; then
    continue
  fi

  # Check if already applied
  applied=$($MYSQL_CMD -sN -e "SELECT COUNT(*) FROM \`_migrations\` WHERE migration_name='$migration_name' AND finished_at IS NOT NULL;")

  if [ "$applied" -gt "0" ]; then
    echo "  ✓ $migration_name (already applied)"
  else
    echo "  → Applying $migration_name..."
    $MYSQL_CMD < "$sql_file"
    $MYSQL_CMD -e "
      INSERT INTO \`_migrations\` (id, checksum, migration_name, finished_at, applied_steps_count)
      VALUES (UUID(), 'manual', '$migration_name', NOW(3), 1)
      ON DUPLICATE KEY UPDATE finished_at=NOW(3);
    "
    echo "  ✓ $migration_name applied"
  fi
done

echo "All migrations done!"
