'use strict';
const express = require('express');
const crypto = require('crypto');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const SUPPORTED_EVENTS = [
  'lead.created',
  'lead.updated',
  'listing.favorited',
  'inquiry.created',
  'listing.published',
  'listing.deactivated',
];

async function getDealer(userId) {
  return prisma.dealer.findFirst({ where: { userId } });
}

/**
 * GET /api/dealer/webhooks
 * List all webhook endpoints for this dealer.
 */
router.get('/', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const hooks = await prisma.dealerWebhook.findMany({
      where:   { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, url: true, events: true, isActive: true,
        lastFiredAt: true, failCount: true, createdAt: true,
        // Never return the secret
      },
    });

    res.json({ webhooks: hooks, supportedEvents: SUPPORTED_EVENTS });
  } catch (err) { next(err); }
});

/**
 * POST /api/dealer/webhooks
 * Register a new webhook endpoint.
 * Body: { url, events: ['lead.created', ...] }
 * Returns the secret ONCE — never stored in plaintext (well, we store it for signing,
 * but we show it only on creation so the dealer can verify signatures).
 */
router.post('/', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { url, events } = req.body;
    if (!url)                 return res.status(400).json({ error: 'url is required' });
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required' });
    }

    // Validate URL
    try { new URL(url); } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Validate events
    const invalid = events.filter(e => !SUPPORTED_EVENTS.includes(e));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Unsupported events: ${invalid.join(', ')}`, supportedEvents: SUPPORTED_EVENTS });
    }

    const secret = `whsec_${crypto.randomBytes(32).toString('base64url')}`;

    const hook = await prisma.dealerWebhook.create({
      data: { dealerId: dealer.id, url, events, secret, isActive: true },
      select: {
        id: true, url: true, events: true, isActive: true, createdAt: true,
      },
    });

    // Return secret ONCE
    res.status(201).json({ webhook: { ...hook, secret } });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/dealer/webhooks/:id
 * Update a webhook (url, events, isActive).
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const hook = await prisma.dealerWebhook.findFirst({
      where: { id: req.params.id, dealerId: dealer.id },
    });
    if (!hook) return res.status(404).json({ error: 'Webhook not found' });

    const { url, events, isActive } = req.body;
    const updated = await prisma.dealerWebhook.update({
      where: { id: hook.id },
      data: {
        ...(url      !== undefined && { url }),
        ...(events   !== undefined && { events }),
        ...(isActive !== undefined && { isActive, failCount: isActive ? 0 : hook.failCount }),
      },
      select: { id: true, url: true, events: true, isActive: true, failCount: true, createdAt: true },
    });

    res.json({ webhook: updated });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/dealer/webhooks/:id
 * Remove a webhook endpoint.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const hook = await prisma.dealerWebhook.findFirst({
      where: { id: req.params.id, dealerId: dealer.id },
    });
    if (!hook) return res.status(404).json({ error: 'Webhook not found' });

    await prisma.dealerWebhook.delete({ where: { id: hook.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/**
 * POST /api/dealer/webhooks/:id/test
 * Send a test ping to the webhook URL.
 */
router.post('/:id/test', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const hook = await prisma.dealerWebhook.findFirst({
      where: { id: req.params.id, dealerId: dealer.id },
    });
    if (!hook) return res.status(404).json({ error: 'Webhook not found' });

    const { dispatchWebhook } = require('../services/webhookDispatcher');
    await dispatchWebhook(dealer.id, 'webhook.test', { message: 'Test event from Ryderr' });

    res.json({ ok: true, message: 'Test event dispatched' });
  } catch (err) { next(err); }
});

module.exports = router;
