'use strict';
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { saveV8AtlasToken, disconnectV8Atlas } = require('../integrations/v8atlas/auth');
const { syncDealerInventory } = require('../integrations/v8atlas/sync');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authenticated dealer user
router.use(authenticate);

// Helper: get dealer from authenticated user
async function getDealer(userId) {
  return prisma.dealer.findFirst({ where: { userId } });
}

/**
 * GET /api/dealer/integrations
 * Returns current integration status for the authenticated dealer.
 */
router.get('/', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const meta = dealer.integrationMeta || {};
    res.json({
      sourceType: dealer.sourceType,
      integrations: {
        manual: {
          active: true, // always available
          label: 'Manual',
        },
        csv: {
          active: dealer.sourceType === 'CSV' || !!meta.last_csv_import,
          lastImport: meta.last_csv_import || null,
          label: 'CSV / Excel Import',
        },
        v8atlas: {
          active:       dealer.sourceType === 'V8ATLAS',
          connected:    !!meta.v8atlas_token,
          connectedAt:  meta.v8atlas_connected_at || null,
          lastSync:     meta.v8atlas_last_sync || null,
          syncError:    meta.v8atlas_sync_error || null,
          label:        'V8Atlas DMS',
        },
      },
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/dealer/integrations/v8atlas/connect
 * Body: { api_token }
 * Saves the V8Atlas API token and sets sourceType to V8ATLAS.
 */
router.post('/v8atlas/connect', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { api_token } = req.body;
    if (!api_token) return res.status(400).json({ error: 'api_token is required' });

    await saveV8AtlasToken(dealer.id, api_token);
    await prisma.dealer.update({
      where: { id: dealer.id },
      data:  { sourceType: 'V8ATLAS' },
    });

    res.json({ ok: true, message: 'V8Atlas connected' });
  } catch (err) { next(err); }
});

/**
 * POST /api/dealer/integrations/v8atlas/disconnect
 * Removes V8Atlas token and reverts sourceType to MANUAL.
 * Listings stay live.
 */
router.post('/v8atlas/disconnect', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    await disconnectV8Atlas(dealer.id);
    res.json({ ok: true, message: 'V8Atlas disconnected. Listings remain active.' });
  } catch (err) { next(err); }
});

/**
 * POST /api/dealer/integrations/v8atlas/sync
 * Manually trigger an inventory sync for this dealer.
 */
router.post('/v8atlas/sync', async (req, res, next) => {
  try {
    const dealer = await getDealer(req.user.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    if (dealer.sourceType !== 'V8ATLAS') return res.status(400).json({ error: 'V8Atlas not connected' });

    const results = await syncDealerInventory(dealer);

    // Record last sync timestamp
    const meta = dealer.integrationMeta || {};
    await prisma.dealer.update({
      where: { id: dealer.id },
      data:  { integrationMeta: { ...meta, v8atlas_last_sync: new Date().toISOString() } },
    });

    res.json({ ok: true, ...results });
  } catch (err) { next(err); }
});

module.exports = router;
