#!/bin/bash
# AutoBentaPH Backup Verification Script
# Restores the latest backup to a temporary database and runs basic checks.
# Usage: ./scripts/verify-backup.sh
#
# Requires: VERIFY_DB_URL env var (a scratch Postgres database, NOT production)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
VERIFY_DB_URL="${VERIFY_DB_URL:-}"

if [ -z "$VERIFY_DB_URL" ]; then
  echo "❌ VERIFY_DB_URL not set (requires a separate scratch database)"
  exit 1
fi

# Find the latest backup
LATEST=$(ls -t "$BACKUP_DIR"/autobenta_*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST" ]; then
  echo "❌ No backups found in $BACKUP_DIR"
  exit 1
fi

echo "🔍 Verifying backup: $LATEST"
echo "🎯 Target: $VERIFY_DB_URL"

# Test integrity
gunzip -t "$LATEST" || { echo "❌ Backup file is corrupted"; exit 1; }
echo "✅ Integrity check passed"

# Restore to verify DB
echo "🔄 Restoring to verification database..."
gunzip -c "$LATEST" | psql "$VERIFY_DB_URL" -q

# Basic row count checks
echo "📊 Running verification queries..."
USER_COUNT=$(psql "$VERIFY_DB_URL" -tAc "SELECT COUNT(*) FROM users")
LISTING_COUNT=$(psql "$VERIFY_DB_URL" -tAc "SELECT COUNT(*) FROM vehicle_listings")
DEALER_COUNT=$(psql "$VERIFY_DB_URL" -tAc "SELECT COUNT(*) FROM dealers")

echo "  Users:    $USER_COUNT"
echo "  Listings: $LISTING_COUNT"
echo "  Dealers:  $DEALER_COUNT"

if [ "$USER_COUNT" -gt 0 ] || [ "$LISTING_COUNT" -gt 0 ]; then
  echo ""
  echo "✅ Backup verification PASSED"
  echo "   Backup $LATEST is valid and restorable"
else
  echo ""
  echo "⚠️  Backup restored but contains no data — verify this is expected"
fi
