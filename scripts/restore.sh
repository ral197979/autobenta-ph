#!/bin/bash
# AutoBentaPH Database Restore Script
# Usage: ./scripts/restore.sh <backup_file> <target_database_url>
#
# ⚠️  WARNING: This DROPS and recreates the target database.
# Only use on a dedicated restore-test database, never on production without a plan.

set -euo pipefail

BACKUP_FILE="${1:-}"
TARGET_URL="${2:-$DATABASE_URL}"

if [ -z "$BACKUP_FILE" ] || [ -z "$TARGET_URL" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.sql.gz> <target_database_url>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will restore $BACKUP_FILE to:"
echo "   $TARGET_URL"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 0
fi

echo "📦 Decompressing backup..."
gunzip -t "$BACKUP_FILE" || { echo "❌ Backup file is corrupted"; exit 1; }

echo "🔄 Restoring database..."
gunzip -c "$BACKUP_FILE" | psql "$TARGET_URL"

echo "✅ Restore complete"
echo ""
echo "Next steps:"
echo "  1. Run: cd backend && npx prisma migrate deploy"
echo "  2. Run: ./scripts/smoke-test.sh to verify"
