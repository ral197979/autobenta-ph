const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Dealer routes ────────────────────────────────────────────────────────────

// GET /dealer/featured — dealer's featured listings
router.get('/dealer/featured', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const featured = await prisma.featuredListing.findMany({
      where: { dealerId: dealer.id },
      include: { listing: { select: { id: true, make: true, model: true, year: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(featured);
  } catch (err) {
    next(err);
  }
});

// POST /dealer/featured — dealer creates a featured request
router.post('/dealer/featured', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { listingId, featureType, endAt, pricePhp } = req.body;
    const validFeatureTypes = ['homepage', 'search_boost', 'featured_dealer', 'sponsored'];
    if (!listingId || !featureType || !endAt || pricePhp == null) {
      return res.status(400).json({ error: 'listingId, featureType, endAt, and pricePhp are required' });
    }
    if (!validFeatureTypes.includes(featureType)) {
      return res.status(400).json({ error: `featureType must be one of: ${validFeatureTypes.join(', ')}` });
    }

    // Verify dealer owns the listing
    const listing = await prisma.vehicleListing.findFirst({ where: { id: listingId, dealerId: dealer.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found or not owned by dealer' });

    // Validate endAt is in the future
    const endDate = new Date(endAt);
    if (isNaN(endDate.getTime()) || endDate <= new Date()) {
      return res.status(400).json({ error: 'endAt must be a future date' });
    }

    const featured = await prisma.featuredListing.create({
      data: {
        listingId,
        dealerId: dealer.id,
        featureType,
        endAt: endDate,
        pricePhp: parseFloat(pricePhp),
        status: 'pending',
      },
      include: { listing: { select: { id: true, make: true, model: true, year: true } } },
    });
    res.status(201).json(featured);
  } catch (err) {
    next(err);
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /admin/featured — list all featured listings, optional ?status= filter
router.get('/admin/featured', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    // Mark expired records on read
    const now = new Date();
    await prisma.featuredListing.updateMany({
      where: { status: 'active', endAt: { lt: now } },
      data: { status: 'expired' },
    });

    const featured = await prisma.featuredListing.findMany({
      where,
      include: {
        listing: { select: { id: true, make: true, model: true, year: true } },
        dealer: { select: { id: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(featured);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/featured/:id — update status/adminNote (approve/reject/cancel)
router.patch('/admin/featured/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    const existing = await prisma.featuredListing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Featured listing not found' });

    const updateData = {};
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    if (status) {
      if (!['pending', 'active', 'expired', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updateData.status = status;

      // When approving: validate dates
      if (status === 'active') {
        const endAt = existing.endAt;
        if (endAt <= new Date()) {
          return res.status(400).json({ error: 'Cannot activate: endAt is in the past' });
        }
      }
    }

    const updated = await prisma.featuredListing.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        listing: { select: { id: true, make: true, model: true, year: true } },
        dealer: { select: { id: true, businessName: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
