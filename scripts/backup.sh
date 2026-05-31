#!/bin/bash
# AutoBentaPH Database Backup Script
# Usage: ./scripts/backup.sh [--verify]
#
# Requires: DATABASE_URL env var or pass as first argument
# Output: backup written to BACKUP_DIR (default: ./backups)

set -euo pipefail

DB_URL="${DATABASE_URL:-$1}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/autobenta_${TIMESTAMP}.sql.gz"
VERIFY="${1:-}"

if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL not set. Export it or pass as argument."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup: $BACKUP_FILE"
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup complete: $BACKUP_FILE ($SIZE)"

# Verify backup integrity
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "✅ Backup integrity check passed"
else
  echo "❌ Backup integrity check FAILED"
  exit 1
fi

# Retention: keep last 30 backups
cd "$BACKUP_DIR" && ls -t autobenta_*.sql.gz | tail -n +31 | xargs -r rm --
echo "🗑️  Old backups pruned (keeping last 30)"

echo ""
echo "Backup summary:"
echo "  File:      $BACKUP_FILE"
echo "  Size:      $SIZE"
echo "  Timestamp: $TIMESTAMP"
echo "  Location:  $BACKUP_DIR"
