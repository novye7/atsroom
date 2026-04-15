#!/bin/bash
# SQLite backup script — run via cron daily
# Usage: 0 3 * * * /path/to/scripts/backup.sh

BACKUP_DIR="$(dirname "$0")/../backups"
DB_PATH="$(dirname "$0")/../data/howmanyat.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
  sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/howmanyat-${TIMESTAMP}.db'"
  # Keep only last 30 backups
  ls -t "$BACKUP_DIR"/howmanyat-*.db 2>/dev/null | tail -n +31 | xargs -r rm --
  echo "Backup created: howmanyat-${TIMESTAMP}.db"
else
  echo "Database not found at $DB_PATH"
  exit 1
fi
