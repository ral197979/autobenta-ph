const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware: block suspended users immediately
async function blockSuspended(req, res, next) {
  if (!req.user) return next();
  if (req.user.isSuspended) {
    return res.status(403).json({
      error: 'Account suspended',
      reason: req.user.suspendReason || 'Violation of terms of service',
    });
  }
  next();
}

// Detect rapid listing creation (>5 in 24h by same seller)
async function detectRapidListings(req, res, next) {
  if (!req.user) return next();
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.vehicleListing.count({
      where: { sellerId: req.user.id, createdAt: { gte: since } },
    });
    if (count >= 5) {
      // flag but don't block — let fraud engine handle it
      req.rapidListingFlag = true;
    }
  } catch { /* non-fatal */ }
  next();
}

// Attach the flag to listing before create (called by listings route)
async function checkRapidListingFlag(userId) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.vehicleListing.count({
    where: { sellerId: userId, createdAt: { gte: since } },
  });
  return count >= 5;
}

module.exports = { blockSuspended, detectRapidListings, checkRapidListingFlag };
