const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, requireRole('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalListings, activeListings, soldListings, pendingListings,
      totalUsers, totalDealers, totalInspections, totalFinancing,
      totalInquiries,
    ] = await Promise.all([
      prisma.vehicleListing.count(),
      prisma.vehicleListing.count({ where: { status: 'active' } }),
      prisma.vehicleListing.count({ where: { status: 'sold' } }),
      prisma.vehicleListing.count({ where: { status: 'pending' } }),
      prisma.user.count(),
      prisma.dealer.count(),
      prisma.inspectionRequest.count(),
      prisma.financingRequest.count(),
      prisma.inquiry.count(),
    ]);

    const avgPriceResult = await prisma.vehicleListing.aggregate({
      where: { status: 'active' },
      _avg: { price: true },
    });

    res.json({
      listings: { total: totalListings, active: activeListings, sold: soldListings, pending: pendingListings },
      users: { total: totalUsers },
      dealers: { total: totalDealers },
      inspections: { total: totalInspections },
      financing: { total: totalFinancing },
      inquiries: { total: totalInquiries },
      averagePrice: avgPriceResult._avg.price,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { role, page = 1, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const skip = (parseInt(page) - 1) * 20;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, isActive: true, isVerified: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: 20,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { isActive, role, isVerified } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(role && { role }),
        ...(isVerified !== undefined && { isVerified }),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, isVerified: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: req.params.id,
        details: { isActive, role, isVerified },
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get('/listings', async (req, res, next) => {
  try {
    const { status, page = 1 } = req.query;
    const where = {};
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * 20;
    const [listings, total] = await Promise.all([
      prisma.vehicleListing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, email: true } },
          photos: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: 20,
      }),
      prisma.vehicleListing.count({ where }),
    ]);
    res.json({ listings, total });
  } catch (err) {
    next(err);
  }
});

router.patch('/listings/:id/status', async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const listing = await prisma.vehicleListing.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `LISTING_${status.toUpperCase()}`,
        entityType: 'VehicleListing',
        entityId: req.params.id,
        details: { status, reason },
      },
    });

    res.json(listing);
  } catch (err) {
    next(err);
  }
});

router.get('/dealers', async (req, res, next) => {
  try {
    const dealers = await prisma.dealer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { listings: true, leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dealers);
  } catch (err) {
    next(err);
  }
});

router.patch('/dealers/:id/verify', async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.update({
      where: { id: req.params.id },
      data: { isVerified: req.body.isVerified },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: req.body.isVerified ? 'DEALER_VERIFIED' : 'DEALER_UNVERIFIED',
        entityType: 'Dealer',
        entityId: req.params.id,
      },
    });

    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

// ─── Extended Dealer Admin Routes ─────────────────────────────────────────────

// GET /admin/dealers/:id — full dealer profile
router.get('/dealers/:id', async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isSuspended: true, suspendReason: true, role: true } },
        subscription: true,
        dealerMetrics: true,
        branches: true,
        _count: { select: { listings: true, leads: true, members: true } },
      },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/dealers/:id/suspend — suspend or unsuspend a dealer
router.patch('/dealers/:id/suspend', async (req, res, next) => {
  try {
    const { suspend, reason } = req.body;
    if (typeof suspend !== 'boolean') {
      return res.status(400).json({ error: 'suspend (boolean) is required' });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    await prisma.user.update({
      where: { id: dealer.userId },
      data: {
        isSuspended: suspend,
        suspendReason: suspend ? (reason ?? null) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: suspend ? 'DEALER_SUSPENDED' : 'DEALER_UNSUSPENDED',
        entityType: 'Dealer',
        entityId: req.params.id,
        details: { suspend, reason },
      },
    });

    res.json({ success: true, dealerId: req.params.id, suspended: suspend });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/dealers/:id — update dealer tier and/or isVerified
router.patch('/dealers/:id', async (req, res, next) => {
  try {
    const { tier, isVerified } = req.body;
    const data = {
      ...(tier !== undefined && { tier }),
      ...(isVerified !== undefined && { isVerified }),
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field: tier or isVerified' });
    }

    const dealer = await prisma.dealer.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DEALER_UPDATED',
        entityType: 'Dealer',
        entityId: req.params.id,
        details: data,
      },
    });

    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

// ─── Dealer Application Admin Routes ──────────────────────────────────────────

// GET /admin/applications — list dealer applications
router.get('/applications', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const applications = await prisma.dealerApplication.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/applications/:id — review application (approve or reject)
router.patch('/applications/:id', async (req, res, next) => {
  try {
    const { action, adminNotes, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    const application = await prisma.dealerApplication.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (action === 'reject') {
      const updated = await prisma.dealerApplication.update({
        where: { id: req.params.id },
        data: {
          status: 'rejected',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          adminNotes: adminNotes ?? null,
          rejectionReason: rejectionReason ?? null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPLICATION_REJECTED',
          entityType: 'DealerApplication',
          entityId: req.params.id,
          details: { rejectionReason, adminNotes },
        },
      });

      return res.json(updated);
    }

    // approve — create Dealer record, assign plan, update user role
    const plan = application.selectedPlan ?? 'free';

    const dealer = await prisma.$transaction(async (tx) => {
      // Create dealer
      const newDealer = await tx.dealer.create({
        data: {
          userId: application.userId,
          businessName: application.businessName ?? application.user.name,
          address: application.address ?? '',
          city: application.city ?? '',
        },
      });

      // Create subscription
      await tx.dealerSubscription.create({
        data: {
          dealerId: newDealer.id,
          plan,
          status: 'active',
        },
      });

      // Update user role to dealer
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'dealer' },
      });

      // Mark application approved and link to dealer
      await tx.dealerApplication.update({
        where: { id: req.params.id },
        data: {
          status: 'approved',
          dealerId: newDealer.id,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          adminNotes: adminNotes ?? null,
        },
      });

      return newDealer;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'APPLICATION_APPROVED',
        entityType: 'DealerApplication',
        entityId: req.params.id,
        details: { dealerId: dealer.id, plan, adminNotes },
      },
    });

    res.json({ application: { id: req.params.id, status: 'approved' }, dealer });
  } catch (err) {
    next(err);
  }
});

// ─── Existing Audit / Financing Routes ────────────────────────────────────────

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.get('/financing', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const requests = await prisma.financingRequest.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        listing: { select: { id: true, make: true, model: true, year: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
