'use strict';
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { apiKeyAuth, requirePermission } = require('../middleware/apiKeyAuth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require API key authentication
router.use(apiKeyAuth);

// ── POST /api/v1/inventory/batch ──────────────────────────────────────────────
// Push a batch of vehicle listings into Ryderr from a dealer system.
// Upserts by externalId — safe to call repeatedly.
// Body: { vehicles: [ { externalId, make, model, year, price, ... } ] }
router.post('/inventory/batch', requirePermission('inventory:write'), async (req, res, next) => {
  try {
    const { vehicles } = req.body;
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({ error: 'vehicles array is required' });
    }
    if (vehicles.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 vehicles per batch' });
    }

    const dealer  = req.dealer;
    const results = { upserted: 0, errors: [] };

    for (const v of vehicles) {
      if (!v.externalId || !v.make || !v.model || !v.year || !v.price) {
        results.errors.push({ externalId: v.externalId || null, error: 'Missing required fields: externalId, make, model, year, price' });
        continue;
      }

      try {
        await prisma.vehicleListing.upsert({
          where:  { externalId_dealerId: { externalId: String(v.externalId), dealerId: dealer.id } },
          update: {
            make:            v.make,
            model:           v.model,
            year:            parseInt(v.year),
            price:           parseFloat(v.price),
            mileage:         v.mileage ? parseInt(v.mileage) : undefined,
            fuelType:        v.fuelType        || v.fuel        || undefined,
            transmission:    v.transmission    || undefined,
            bodyType:        v.bodyType        || undefined,
            condition:       normalizeCondition(v.condition),
            status:          normalizeStatus(v.status),
            description:     v.description     || undefined,
            inventorySource: dealer.sourceType || 'API',
          },
          create: {
            sellerId:        dealer.userId,
            dealerId:        dealer.id,
            externalId:      String(v.externalId),
            inventorySource: dealer.sourceType || 'API',
            sellerType:      'dealer',
            make:            v.make,
            model:           v.model,
            year:            parseInt(v.year),
            price:           parseFloat(v.price),
            mileage:         v.mileage ? parseInt(v.mileage) : 0,
            fuelType:        v.fuelType     || v.fuel     || 'gasoline',
            transmission:    v.transmission || 'automatic',
            bodyType:        v.bodyType     || 'sedan',
            condition:       normalizeCondition(v.condition),
            status:          normalizeStatus(v.status),
            location:        dealer.city,
            city:            dealer.city,
            region:          'NCR',
            description:     v.description || `${v.year} ${v.make} ${v.model}`,
          },
        });
        results.upserted++;
      } catch (e) {
        results.errors.push({ externalId: v.externalId, error: e.message });
      }
    }

    res.json({ ok: true, upserted: results.upserted, errors: results.errors });
  } catch (err) { next(err); }
});

// ── DELETE /api/v1/inventory/:externalId ──────────────────────────────────────
// Remove a listing by its external ID (archives it, does not hard-delete).
router.delete('/inventory/:externalId', requirePermission('inventory:write'), async (req, res, next) => {
  try {
    const dealer = req.dealer;
    const result = await prisma.vehicleListing.updateMany({
      where:  { externalId: req.params.externalId, dealerId: dealer.id },
      data:   { status: 'archived' },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json({ ok: true, archived: result.count });
  } catch (err) { next(err); }
});

// ── GET /api/v1/leads ─────────────────────────────────────────────────────────
// Pull leads generated on Ryderr for this dealer.
// Params: ?since=ISO_DATE&status=new&limit=50
router.get('/leads', requirePermission('leads:read'), async (req, res, next) => {
  try {
    const dealer = req.dealer;
    const { since, status, limit = 50 } = req.query;

    const where = {
      dealerId: dealer.id,
      ...(status && { status }),
      ...(since  && { createdAt: { gte: new Date(since) } }),
    };

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    Math.min(parseInt(limit) || 50, 200),
      select: {
        id: true, buyerName: true, buyerEmail: true, buyerPhone: true,
        notes: true, status: true, createdAt: true,
        listing: { select: { id: true, make: true, model: true, year: true, externalId: true } },
      },
    });

    res.json({ leads, count: leads.length });
  } catch (err) { next(err); }
});

// ── GET /api/v1/leads/:id ─────────────────────────────────────────────────────
router.get('/leads/:id', requirePermission('leads:read'), async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: { listing: true },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead });
  } catch (err) { next(err); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeCondition(c) {
  if (!c) return 'good';
  const map = { new: 'excellent', New: 'excellent', used: 'good', Used: 'good', certified: 'excellent', Certified: 'excellent', fair: 'fair', poor: 'poor' };
  return map[c] || 'good';
}

function normalizeStatus(s) {
  if (!s) return 'active';
  const map = { Available: 'active', available: 'active', Sold: 'sold', sold: 'sold', Reserved: 'draft', Pending: 'draft', Inactive: 'archived' };
  return map[s] || 'active';
}

module.exports = router;
