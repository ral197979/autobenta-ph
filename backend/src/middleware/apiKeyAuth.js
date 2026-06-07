'use strict';
const bcrypt = require('bcryptjs');
const prisma = require("../lib/prisma");

/**
 * Authenticates requests from third-party dealer apps using an API key.
 * The key is passed via:  X-API-Key: ryd_live_xxxxxxxxxxxxxxxx
 *
 * On success, sets req.dealer and req.apiKey on the request.
 * On failure, returns 401.
 */
async function apiKeyAuth(req, res, next) {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) return res.status(401).json({ error: 'X-API-Key header required' });

  // Key format: ryd_live_<random> — prefix is first 16 chars e.g. "ryd_live_abc123x"
  const prefix = rawKey.slice(0, 16);

  try {
    // Find candidates by prefix (avoids full-table bcrypt scan)
    const candidates = await prisma.dealerApiKey.findMany({
      where: { keyPrefix: prefix, isActive: true },
      include: { dealer: true },
    });

    let matched = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(rawKey, candidate.keyHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) return res.status(401).json({ error: 'Invalid or revoked API key' });

    // Check expiry
    if (matched.expiresAt && matched.expiresAt < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Update lastUsedAt async (don't block the request)
    prisma.dealerApiKey.update({
      where: { id: matched.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    req.dealer  = matched.dealer;
    req.apiKey  = matched;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory — requires a specific permission on the API key.
 * Usage: requirePermission('inventory:write')
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey?.permissions?.includes(permission)) {
      return res.status(403).json({ error: `API key missing permission: ${permission}` });
    }
    next();
  };
}

module.exports = { apiKeyAuth, requirePermission };
