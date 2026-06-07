const express = require('express');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');
const { auditFromReq } = require('../services/audit/auditLogger');

const router = express.Router();

// GET /api/admin/moderation — pending listings queue
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, minFraudScore = 0 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: 'pending',
      fraudScore: { gte: parseInt(minFraudScore) },
    };

    const [listings, total] = await Promise.all([
      prisma.vehicleListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fraudScore: 'desc' }, { createdAt: 'asc' }],
        include: {
          seller: { select: { id: true, name: true, email: true } },
          photos: { where: { isPrimary: true }, take: 1 },
          fraudFlagRecords: { where: { isResolved: false } },
          _count: { select: { photos: true } },
        },
      }),
      prisma.vehicleListing.count({ where }),
    ]);

    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/moderation/:listingId — take moderation action
router.post('/:listingId', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { action, reason, details } = req.body;

    const validActions = ['approve', 'reject', 'flag', 'request_info', 'escalate', 'suspend_seller', 'restore'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid moderation action' });
    }

    const listing = await prisma.vehicleListing.findUnique({
      where: { id: req.params.listingId },
      include: { seller: true },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const previousStatus = listing.status;
    let newStatus = listing.status;
    let sellerUpdate = null;

    switch (action) {
      case 'approve':   newStatus = 'active';    break;
      case 'reject':    newStatus = 'rejected';  break;
      case 'flag':      newStatus = 'flagged';   break;
      case 'restore':   newStatus = 'pending';   break;
      case 'suspend_seller':
        sellerUpdate = { isSuspended: true, suspendReason: reason || 'Moderation action' };
        break;
    }

    const [moderationAction] = await Promise.all([
      prisma.listingModerationAction.create({
        data: {
          listingId: req.params.listingId,
          adminId: req.user.id,
          action,
          reason,
          details: details || null,
          previousStatus,
          newStatus,
        },
      }),
      prisma.vehicleListing.update({
        where: { id: req.params.listingId },
        data: {
          status: newStatus,
          moderationNote: reason || null,
          ...(newStatus === 'active' && !listing.listedAt ? { listedAt: new Date() } : {}),
        },
      }),
      sellerUpdate
        ? prisma.user.update({ where: { id: listing.sellerId }, data: sellerUpdate })
        : Promise.resolve(),
    ]);

    await auditFromReq(req, `listing.${action}`, 'VehicleListing', req.params.listingId, { reason, previousStatus, newStatus });

    res.json({ success: true, moderationAction });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/moderation/:listingId/history — moderation action history
router.get('/:listingId/history', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const actions = await prisma.listingModerationAction.findMany({
      where: { listingId: req.params.listingId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(actions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
