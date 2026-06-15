'use strict';
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

async function getDealer(userId) {
  return prisma.dealer.findFirst({ where: { userId } });
}

// Generate a cryptographically secure API key
function generateKey() {
  const random = crypto.randomBytes(24).toString('base64url');
  return `ryd_live_${random}`;
}

/**
 * GET /api/dealer/api-keys
 * List all API keys for this dealer (never returns the raw key).
 */
router.get('/', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const keys = await prisma.dealerApiKey.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, keyPrefix: true, permissions: true,
        isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true,
      },
    });

    res.json({ keys });
  } catch (err) { next(err); }
});

/**
 * POST /api/dealer/api-keys
 * Create a new API key. Returns the raw key ONCE — never stored in plaintext.
 * Body: { name, permissions?, expiresAt? }
 */
router.post('/', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { name, permissions, expiresAt } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const rawKey  = generateKey();
    const prefix  = rawKey.slice(0, 16);
    const keyHash = await bcrypt.hash(rawKey, 10);

    const key = await prisma.dealerApiKey.create({
      data: {
        dealerId:    dealer.id,
        name,
        keyHash,
        keyPrefix:   prefix,
        permissions: permissions || ['inventory:write', 'leads:read'],
        expiresAt:   expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true, name: true, keyPrefix: true, permissions: true,
        isActive: true, expiresAt: true, createdAt: true,
      },
    });

    // Return raw key only once
    res.status(201).json({ key: { ...key, rawKey } });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/dealer/api-keys/:id
 * Revoke (deactivate) an API key.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const key = await prisma.dealerApiKey.findFirst({
      where: { id: req.params.id, dealerId: dealer.id },
    });
    if (!key) return res.status(404).json({ error: 'API key not found' });

    await prisma.dealerApiKey.update({
      where: { id: key.id },
      data: { isActive: false },
    });

    res.json({ ok: true, message: 'API key revoked' });
  } catch (err) { next(err); }
});

module.exports = router;
