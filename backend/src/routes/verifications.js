const express = require('express');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');
const uploadDocument = require('../middleware/uploadDocument');
const { auditLog } = require('../services/audit/auditLogger');
const { computeReadinessScore } = require('../services/verification/readinessEngine');

const router = express.Router();

// ─── Seller: Submit a verification request ────────────────────────────────────

router.post('/', authenticate, uploadDocument.array('documents', 5), async (req, res, next) => {
  try {
    const { verificationType, listingId, documentTypes } = req.body;

    const VALID_TYPES = ['seller_identity', 'dealer_business', 'ownership', 'vehicle', 'transfer_readiness'];
    if (!VALID_TYPES.includes(verificationType)) {
      return res.status(400).json({ error: 'Invalid verification type' });
    }

    // One active request per type per user
    const existing = await prisma.verificationRequest.findFirst({
      where: {
        userId: req.user.id,
        verificationType,
        status: { in: ['pending', 'under_review'] },
        ...(listingId && { listingId }),
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'A verification request of this type is already under review', requestId: existing.id });
    }

    const docTypesArr = documentTypes
      ? (Array.isArray(documentTypes) ? documentTypes : documentTypes.split(','))
      : [];

    const request = await prisma.verificationRequest.create({
      data: {
        userId: req.user.id,
        listingId: listingId || null,
        verificationType,
        status: 'pending',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        documents: req.files?.length > 0 ? {
          create: req.files.map((file, i) => ({
            documentType: docTypesArr[i] || 'other',
            url: file.url || `/uploads/documents/${file.filename}`,
            storageKey: file.storageKey || `documents/${file.filename}`,
            provider: file.provider || 'local',
            fileName: file.originalname,
            sizeBytes: file.size,
            mimeType: file.mimetype,
          })),
        } : undefined,
        statusHistory: {
          create: { toStatus: 'pending', changedBy: req.user.id },
        },
      },
      include: { documents: true },
    });

    await auditLog({
      userId: req.user.id,
      action: 'verification_submitted',
      entityType: 'verification_request',
      entityId: request.id,
      details: { verificationType, listingId, documentCount: req.files?.length || 0 },
      ipAddress: req.ip,
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// ─── Seller: List own verification requests ───────────────────────────────────

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { userId: req.user.id },
      include: {
        documents: { select: { id: true, documentType: true, fileName: true, uploadedAt: true } },
        statusHistory: { orderBy: { changedAt: 'desc' }, take: 5 },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// ─── Readiness score for a listing ────────────────────────────────────────────

router.get('/listing/:listingId/readiness-score', async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: req.params.listingId },
      include: {
        inspectionRequests: { where: { status: 'completed' }, take: 1 },
        seller: { select: { isVerified: true, verificationScore: true } },
        dealer: { select: { isVerified: true } },
        verificationRequests: {
          where: { status: 'approved' },
          select: { verificationType: true, expiresAt: true, verificationScore: true },
        },
      },
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const score = computeReadinessScore(listing);

    // Persist if changed
    if (listing.readinessScore !== score.total) {
      await prisma.vehicleListing.update({
        where: { id: listing.id },
        data: {
          readinessScore: score.total,
          readinessReason: score.criteria,
          readinessEvaluatedAt: new Date(),
        },
      });
    }

    res.json(score);
  } catch (err) {
    next(err);
  }
});

// ─── Admin: List verification queue ───────────────────────────────────────────

router.get('/admin/queue', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status = 'pending', type, page = 1 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.verificationType = type;

    const skip = (parseInt(page) - 1) * 20;
    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          listing: { select: { id: true, make: true, model: true, year: true } },
          documents: { select: { id: true, documentType: true, url: true, fileName: true } },
          reviews: { orderBy: { reviewedAt: 'desc' }, take: 1, include: { reviewer: { select: { name: true } } } },
        },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: 20,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    res.json({ requests, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: Queue stats ───────────────────────────────────────────────────────

router.get('/admin/stats', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, underReview, approvedToday, rejectedToday, byType] = await Promise.all([
      prisma.verificationRequest.count({ where: { status: 'pending' } }),
      prisma.verificationRequest.count({ where: { status: 'under_review' } }),
      prisma.verificationRequest.count({ where: { status: 'approved', submittedAt: { gte: today } } }),
      prisma.verificationRequest.count({ where: { status: 'rejected', submittedAt: { gte: today } } }),
      prisma.verificationRequest.groupBy({ by: ['verificationType', 'status'], _count: true }),
    ]);

    res.json({ pending, underReview, approvedToday, rejectedToday, byType });
  } catch (err) {
    next(err);
  }
});

// ─── Admin: Review a verification request ────────────────────────────────────

router.patch('/admin/:id/review', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { action, notes, rejectionReason } = req.body;
    const VALID_ACTIONS = ['under_review', 'approved', 'rejected', 'suspended'];
    if (!VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const existing = await prisma.verificationRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const req_ = await tx.verificationRequest.update({
        where: { id: req.params.id },
        data: {
          status: action,
          rejectionReason: rejectionReason || null,
          adminNotes: notes || null,
          reviews: {
            create: {
              reviewerId: req.user.id,
              action,
              notes,
            },
          },
          statusHistory: {
            create: {
              fromStatus: existing.status,
              toStatus: action,
              changedBy: req.user.id,
              reason: rejectionReason || notes,
            },
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          listing: { select: { id: true, make: true, model: true, year: true } },
        },
      });

      // Propagate approval to trust fields
      if (action === 'approved') {
        await propagateApproval(tx, req_, existing.verificationType);
      } else if (action === 'rejected' || action === 'suspended') {
        await propagateRevocation(tx, req_, existing.verificationType);
      }

      return req_;
    });

    await auditLog({
      userId: req.user.id,
      action: `verification_${action}`,
      entityType: 'verification_request',
      entityId: req.params.id,
      details: { verificationType: existing.verificationType, notes, rejectionReason },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── Trust propagation helpers ────────────────────────────────────────────────

async function propagateApproval(tx, request, type) {
  if (type === 'seller_identity') {
    await tx.user.update({
      where: { id: request.userId },
      data: {
        isVerified: true,
        verificationScore: request.verificationScore || 80,
        verificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    // Mark all active listings for this seller as sellerVerified
    await tx.vehicleListing.updateMany({
      where: { sellerId: request.userId, status: { in: ['active', 'pending'] } },
      data: { sellerVerified: true },
    });
  }

  if (type === 'dealer_business') {
    await tx.dealer.updateMany({
      where: { userId: request.userId },
      data: { isVerified: true },
    });
  }

  if (type === 'ownership' && request.listingId) {
    await tx.vehicleListing.update({
      where: { id: request.listingId },
      data: { ownershipVerified: true },
    });
  }

  if (type === 'vehicle' && request.listingId) {
    await tx.vehicleListing.update({
      where: { id: request.listingId },
      data: { vehicleHistoryAvailable: true },
    });
  }

  if (type === 'transfer_readiness' && request.listingId) {
    await recomputeTransferReady(tx, request.listingId);
  }
}

async function propagateRevocation(tx, request, type) {
  if (type === 'seller_identity') {
    await tx.user.update({
      where: { id: request.userId },
      data: { isVerified: false, verificationScore: null, verificationExpiry: null },
    });
    await tx.vehicleListing.updateMany({
      where: { sellerId: request.userId },
      data: { sellerVerified: false },
    });
  }
  if (type === 'ownership' && request.listingId) {
    await tx.vehicleListing.update({
      where: { id: request.listingId },
      data: { ownershipVerified: false, transferReady: false },
    });
  }
}

async function recomputeTransferReady(tx, listingId) {
  const listing = await tx.vehicleListing.findUnique({
    where: { id: listingId },
    select: { ownershipVerified: true, sellerVerified: true, hasOrCr: true },
  });
  if (!listing) return;

  const ready = listing.ownershipVerified && listing.sellerVerified && listing.hasOrCr;
  await tx.vehicleListing.update({
    where: { id: listingId },
    data: { transferReady: ready },
  });
}

module.exports = router;
