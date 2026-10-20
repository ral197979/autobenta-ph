const express = require('express');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

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

      // Create subscription — 90-day free trial, full Pro features
      await tx.dealerSubscription.create({
        data: {
          dealerId:    newDealer.id,
          plan:        'pro',
          status:      'trial',
          startedAt:   new Date(),
          trialEndsAt: new Date(Date.now() + 90 * 86400000),
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

// POST /api/admin/seed-accounts — create test accounts (idempotent)
router.post('/seed-accounts', async (req, res, next) => {
  const bcrypt = require('bcryptjs');
  const PASSWORD = 'AutoBenta2026!';

  const ACCOUNTS = [
    {
      email: 'dealer1@autobentaph.test', name: 'Maria Cruz', phone: '09171234001', role: 'dealer',
      dealer: { businessName: 'Cruz Vehicles', city: 'Pasig', address: '123 Ortigas Ave, Pasig City', description: 'Trusted pre-owned vehicle dealer in Pasig since 2015. Specializing in Toyota and Honda.', isVerified: true, tier: 'verified_pro', plan: 'pro' },
      listings: [
        { make: 'Toyota', model: 'Fortuner', year: 2021, variant: '2.4 V Diesel 4x2 AT', price: 1780000, mileage: 35000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', condition: 'excellent', city: 'Pasig' },
        { make: 'Toyota', model: 'Hilux', year: 2020, variant: 'G 4x2 MT', price: 1050000, mileage: 42000, fuelType: 'diesel', transmission: 'manual', bodyType: 'pickup', condition: 'good', city: 'Pasig' },
        { make: 'Toyota', model: 'Innova', year: 2022, variant: 'E Diesel MT', price: 1180000, mileage: 18000, fuelType: 'diesel', transmission: 'manual', bodyType: 'van', condition: 'excellent', city: 'Pasig' },
        { make: 'Honda', model: 'CR-V', year: 2020, variant: '1.5 Turbo Prestige CVT', price: 1250000, mileage: 42000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'crossover', condition: 'excellent', city: 'Pasig' },
        { make: 'Honda', model: 'Civic', year: 2019, variant: '1.8 E CVT', price: 820000, mileage: 58000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'good', city: 'Pasig' },
        { make: 'Mitsubishi', model: 'Montero Sport', year: 2021, variant: 'GLS 2WD AT', price: 1490000, mileage: 27000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', condition: 'excellent', city: 'Pasig' },
        { make: 'Ford', model: 'Ranger', year: 2020, variant: 'Wildtrak 2.0 AT', price: 1350000, mileage: 48000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'pickup', condition: 'good', city: 'Pasig' },
        { make: 'Hyundai', model: 'Tucson', year: 2019, variant: '2.0 GL AT', price: 890000, mileage: 62000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'crossover', condition: 'good', city: 'Pasig' },
      ],
    },
    {
      email: 'dealer2@autobentaph.test', name: 'Ernesto Soriano', phone: '09182345002', role: 'dealer',
      dealer: { businessName: 'Soriano Motor Works', city: 'Caloocan', address: '456 EDSA Extension, Caloocan City', description: 'Family-run dealership with 20 years in the business. Budget-friendly options.', isVerified: false, tier: 'basic', plan: 'free' },
      listings: [
        { make: 'Toyota', model: 'Vios', year: 2018, variant: '1.3 E MT', price: 490000, mileage: 75000, fuelType: 'gasoline', transmission: 'manual', bodyType: 'sedan', condition: 'good', city: 'Caloocan' },
        { make: 'Toyota', model: 'Wigo', year: 2020, variant: '1.0 G AT', price: 420000, mileage: 38000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'hatchback', condition: 'good', city: 'Caloocan' },
        { make: 'Mitsubishi', model: 'Mirage', year: 2019, variant: 'GLS CVT', price: 430000, mileage: 54000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'hatchback', condition: 'good', city: 'Caloocan' },
        { make: 'Suzuki', model: 'Ertiga', year: 2020, variant: 'GL MT', price: 580000, mileage: 44000, fuelType: 'gasoline', transmission: 'manual', bodyType: 'van', condition: 'good', city: 'Caloocan' },
      ],
    },
    {
      email: 'seller1@autobentaph.test', name: 'Juan Reyes', phone: '09193456003', role: 'seller', dealer: null,
      listings: [
        { make: 'Toyota', model: 'Corolla Altis', year: 2017, variant: '1.6 V AT', price: 720000, mileage: 68000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'good', city: 'Quezon City', sellerType: 'private' },
        { make: 'Honda', model: 'Jazz', year: 2018, variant: '1.5 V CVT', price: 650000, mileage: 55000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'hatchback', condition: 'excellent', city: 'Quezon City', sellerType: 'private' },
        { make: 'Nissan', model: 'Navara', year: 2019, variant: 'EL 4x2 AT', price: 980000, mileage: 61000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'pickup', condition: 'good', city: 'Quezon City', sellerType: 'private' },
      ],
    },
    {
      email: 'seller2@autobentaph.test', name: 'Maria Santos', phone: '09204567004', role: 'seller', dealer: null,
      listings: [
        { make: 'Hyundai', model: 'Starex', year: 2017, variant: 'GL MT', price: 850000, mileage: 125000, fuelType: 'diesel', transmission: 'manual', bodyType: 'van', condition: 'fair', city: 'Davao City', sellerType: 'private' },
        { make: 'Ford', model: 'EcoSport', year: 2020, variant: '1.5 Trend AT', price: 620000, mileage: 32000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'crossover', condition: 'excellent', city: 'Cebu City', sellerType: 'private' },
      ],
    },
    {
      email: 'buyer1@autobentaph.test', name: 'Carlos dela Cruz', phone: '09215678005', role: 'buyer', dealer: null,
      listings: [],
    },
  ];

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const results = [];

    for (const account of ACCOUNTS) {
      const existing = await prisma.user.findUnique({ where: { email: account.email } });
      if (existing) { results.push({ email: account.email, status: 'skipped' }); continue; }

      const user = await prisma.user.create({
        data: { email: account.email, name: account.name, phone: account.phone, role: account.role, passwordHash, isVerified: true, isActive: true },
      });

      let dealerId = null;
      if (account.dealer) {
        const dealer = await prisma.dealer.create({
          data: { userId: user.id, businessName: account.dealer.businessName, city: account.dealer.city, address: account.dealer.address, description: account.dealer.description, isVerified: account.dealer.isVerified, tier: account.dealer.tier },
        });
        dealerId = dealer.id;
        await prisma.dealerSubscription.create({
          data: { dealerId: dealer.id, plan: 'pro', status: 'trial', startedAt: new Date(), trialEndsAt: new Date(Date.now() + 90 * 86400000), expiresAt: null },
        });
      }

      for (const v of account.listings) {
        await prisma.vehicleListing.create({
          data: { sellerId: user.id, dealerId, make: v.make, model: v.model, year: v.year, variant: v.variant, price: v.price, mileage: v.mileage, fuelType: v.fuelType, transmission: v.transmission, bodyType: v.bodyType, condition: v.condition, location: v.city, city: v.city, region: 'NCR', description: `${v.year} ${v.make} ${v.model} ${v.variant} in ${v.condition} condition. Well-maintained, complete documents.`, status: 'active', sellerType: v.sellerType || (dealerId ? 'dealer' : 'private') },
        });
      }

      results.push({ email: account.email, role: account.role, listings: account.listings.length, status: 'created' });
    }

    res.json({ ok: true, password: PASSWORD, results });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/dealers/:dealerId/start-trial
// Manually start or reset a 90-day trial for a dealer
router.post('/dealers/:dealerId/start-trial', async (req, res, next) => {
  try {
    const { startTrial } = require('../services/trial');
    const sub = await startTrial(req.params.dealerId);
    res.json({ ok: true, subscription: sub });
  } catch (err) { next(err); }
});

module.exports = router;
