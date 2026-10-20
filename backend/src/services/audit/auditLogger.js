const prisma = require("../../lib/prisma");
const { computeHash } = require('./tamperHash');


/**
 * Log an auditable action. Automatically chains to the previous log entry via SHA-256.
 *
 * @param {object} params
 * @param {string|null} params.userId
 * @param {string} params.action
 * @param {string} params.entityType
 * @param {string|null} params.entityId
 * @param {object|null} params.details
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 * @param {string|null} params.requestId
 */
async function auditLog({
  userId = null,
  action,
  entityType,
  entityId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
  requestId = null,
}) {
  try {
    // Get the most recent hash for chaining
    const lastEntry = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    });
    const prevHash = lastEntry?.hash || null;

    const now = new Date();
    const tempRecord = { userId, action, entityType, entityId, details, ipAddress, createdAt: now };
    const hash = computeHash(tempRecord, prevHash);

    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
        requestId,
        prevHash,
        hash,
        createdAt: now,
      },
    });
  } catch (err) {
    // Non-fatal: audit logging should never crash the main request
    console.error('auditLog error:', err.message);
  }
}

/**
 * Convenience: build audit call from Express req + action metadata.
 */
function auditFromReq(req, action, entityType, entityId, details) {
  return auditLog({
    userId: req.user?.id || null,
    action,
    entityType,
    entityId,
    details,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
  });
}

module.exports = { auditLog, auditFromReq };
