/**
 * V8Atlas inbound webhook handler.
 * Receives events from V8Atlas DMS and applies them to AutoBentaPH data.
 * All routes verified with HMAC-SHA256 signature.
 */
const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { auditLog } = require('../services/audit/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Signature verification middleware ────────────────────────────────────────

function verifyV8AtlasSignature(req, res, next) {
  if (!process.env.V8ATLAS_WEBHOOK_SECRET) {
    // In production this must be set — reject all webhooks if secret is missing
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    return next(); // dev-only bypass
  }
  const signature = req.headers['x-v8atlas-signature'];
  if (!signature) return res.status(401).json({ error: 'Missing webhook signature' });

  const expected = crypto
    .createHmac('sha256', process.env.V8ATLAS_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid webhook signature format' });
  }
  next();
}

router.use(verifyV8AtlasSignature);

// ─── dealer.verification.completed ───────────────────────────────────────────

router.post('/dealer-verified', async (req, res, next) => {
  try {
    const { autobentaDealerId, verificationLevel, verifiedAt, expiresAt } = req.body;

    const dealer = await prisma.dealer.findUnique({ where: { id: autobentaDealerId } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const tierMap = { basic: 'basic', verified: 'verified', verified_pro: 'verified_pro', enterprise: 'enterprise' };
    const tier = tierMap[verificationLevel] || 'verified';

    await prisma.$transaction([
      prisma.dealer.update({ where: { id: autobentaDealerId }, data: { isVerified: true, tier } }),
      prisma.verificationRequest.create({
        data: {
          userId: dealer.userId,
          verificationType: 'dealer_business',
          status: 'approved',
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          metadata: { source: 'v8atlas', verificationLevel },
          statusHistory: { create: { toStatus: 'approved', changedBy: 'v8atlas', reason: 'V8Atlas verification sync' } },
        },
      }),
    ]);

    await auditLog({ action: 'v8atlas_dealer_verification_sync', entityType: 'dealer', entityId: autobentaDealerId, details: { verificationLevel, source: 'v8atlas' } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── inventory.listing.upserted ───────────────────────────────────────────────

router.post('/inventory-sync', async (req, res, next) => {
  try {
    const { autobentaDealerId, v8atlasVehicleId, data } = req.body;

    const dealer = await prisma.dealer.findUnique({ where: { id: autobentaDealerId } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const existing = await prisma.vehicleListing.findFirst({
      where: { dealerId: autobentaDealerId, aiDraftData: { path: ['v8atlasVehicleId'], equals: v8atlasVehicleId } },
    });

    const listingData = {
      make: data.make, model: data.model, year: data.year,
      price: parseFloat(data.price), mileage: parseInt(data.mileage),
      status: data.status || 'active', city: data.city || dealer.city,
      location: data.location || dealer.address, region: data.region || 'NCR',
      hasOrCr: !!data.orCrVerified, ownershipVerified: !!data.ownershipVerified,
      aiDraftData: { v8atlasVehicleId, syncedAt: new Date().toISOString(), source: 'v8atlas' },
    };

    let listing;
    if (existing) {
      listing = await prisma.vehicleListing.update({ where: { id: existing.id }, data: listingData });
    } else {
      listing = await prisma.vehicleListing.create({
        data: { ...listingData, sellerId: dealer.userId, dealerId: autobentaDealerId, sellerType: 'dealer' },
      });
    }

    if (data.photos?.length > 0) {
      await prisma.vehiclePhoto.deleteMany({ where: { listingId: listing.id } });
      await prisma.vehiclePhoto.createMany({
        data: data.photos.map((url, i) => ({ listingId: listing.id, url, isPrimary: i === 0, sortOrder: i })),
      });
    }

    await auditLog({ action: 'v8atlas_inventory_sync', entityType: 'listing', entityId: listing.id, details: { v8atlasVehicleId, created: !existing } });

    res.json({ id: listing.id, created: !existing });
  } catch (err) {
    next(err);
  }
});

// ─── trust.verification.approved ─────────────────────────────────────────────

router.post('/trust-sync', async (req, res, next) => {
  try {
    const { verificationType, listingId, verifiedBy } = req.body;

    if (!listingId) return res.status(400).json({ error: 'listingId required' });

    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const update = {};
    if (verificationType === 'ownership') update.ownershipVerified = true;
    if (verificationType === 'vehicle') update.vehicleHistoryAvailable = true;

    if (Object.keys(update).length > 0) {
      await prisma.vehicleListing.update({ where: { id: listingId }, data: update });
    }

    await auditLog({ action: 'v8atlas_trust_sync', entityType: 'listing', entityId: listingId, details: { verificationType, verifiedBy, source: 'v8atlas' } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
