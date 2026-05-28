const crypto = require('crypto');

/**
 * Compute a SHA-256 hash for an audit log entry.
 * Includes the previous hash to form a chain.
 */
function computeHash(record, prevHash) {
  const content = JSON.stringify({
    userId: record.userId,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    details: record.details,
    ipAddress: record.ipAddress,
    createdAt: record.createdAt,
    prevHash,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Verify the chain integrity from a list of ordered audit log entries.
 * Returns { valid: boolean, brokenAt: entry | null }
 */
function verifyChain(entries) {
  let prevHash = null;
  for (const entry of entries) {
    const expected = computeHash(entry, prevHash);
    if (entry.hash !== expected) {
      return { valid: false, brokenAt: entry };
    }
    prevHash = entry.hash;
  }
  return { valid: true, brokenAt: null };
}

module.exports = { computeHash, verifyChain };
