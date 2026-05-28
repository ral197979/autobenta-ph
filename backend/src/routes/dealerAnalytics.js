const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dealer/analytics — dealer dashboard metrics
router.get('/', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealerId = req.query.dealerId || null;

    // Admins can query any dealer; dealers can only see their own
    let dealer;
    if (req.user.role === 'admin' && dealerId) {
      dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    } else {
      dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    }
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalListings,
      activeListings,
      soldListings,
      totalLeads,
      newLeads,
      wonLeads,
      lostLeads,
      recentActivities,
      upcomingReminders,
      listingsByStatus,
      leadsByStatus,
    ] = await Promise.all([
      prisma.vehicleListing.count({ where: { dealerId: dealer.id } }),
      prisma.vehicleListing.count({ where: { dealerId: dealer.id, status: 'active' } }),
      prisma.vehicleListing.count({ where: { dealerId: dealer.id, status: 'sold' } }),
      prisma.lead.count({ where: { dealerId: dealer.id } }),
      prisma.lead.count({ where: { dealerId: dealer.id, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { dealerId: dealer.id, status: 'closed_won' } }),
      prisma.lead.count({ where: { dealerId: dealer.id, status: 'closed_lost' } }),
      prisma.dealerActivity.findMany({
        where: { dealerId: dealer.id, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { lead: { select: { buyerName: true, status: true } } },
      }),
      prisma.dealerReminder.findMany({
        where: { dealerId: dealer.id, isDone: false, dueAt: { gte: new Date() } },
        orderBy: { dueAt: 'asc' },
        take: 5,
      }),
      prisma.vehicleListing.groupBy({
        by: ['status'],
        where: { dealerId: dealer.id },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { dealerId: dealer.id },
        _count: { id: true },
      }),
    ]);

    // Inventory aging: listings older than 30/60/90 days still active
    const [aging30, aging60, aging90] = await Promise.all([
      prisma.vehicleListing.count({
        where: { dealerId: dealer.id, status: 'active', listedAt: { lte: thirtyDaysAgo } },
      }),
      prisma.vehicleListing.count({
        where: { dealerId: dealer.id, status: 'active', listedAt: { lte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.vehicleListing.count({
        where: { dealerId: dealer.id, status: 'active', listedAt: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const winRate = (totalLeads > 0) ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const conversionRate = (totalLeads > 0) ? Math.round(((wonLeads + lostLeads) > 0 ? wonLeads / (wonLeads + lostLeads) : 0) * 100) : 0;

    res.json({
      dealer: { id: dealer.id, businessName: dealer.businessName },
      listings: { total: totalListings, active: activeListings, sold: soldListings, byStatus: listingsByStatus },
      leads: { total: totalLeads, new30Days: newLeads, won: wonLeads, lost: lostLeads, winRate, conversionRate, byStatus: leadsByStatus },
      inventory: { aging30, aging60, aging90 },
      recentActivities,
      upcomingReminders,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dealer/reminders — list reminders
router.get('/reminders', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    const { done = 'false' } = req.query;
    const reminders = await prisma.dealerReminder.findMany({
      where: { dealerId: dealer.id, isDone: done === 'true' },
      orderBy: { dueAt: 'asc' },
    });
    res.json(reminders);
  } catch (err) {
    next(err);
  }
});

// POST /api/dealer/reminders — create reminder
router.post('/reminders', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    const { title, dueAt, leadId, notes } = req.body;
    if (!title || !dueAt) return res.status(400).json({ error: 'title and dueAt required' });

    const reminder = await prisma.dealerReminder.create({
      data: { dealerId: dealer.id, title, dueAt: new Date(dueAt), leadId: leadId || null, notes },
    });
    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/dealer/reminders/:id — mark done / update
router.patch('/reminders/:id', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const { isDone, title, dueAt, notes } = req.body;
    const data = {};
    if (isDone !== undefined) {
      data.isDone = isDone;
      if (isDone) data.doneAt = new Date();
    }
    if (title) data.title = title;
    if (dueAt) data.dueAt = new Date(dueAt);
    if (notes !== undefined) data.notes = notes;

    const reminder = await prisma.dealerReminder.update({ where: { id: req.params.id }, data });
    res.json(reminder);
  } catch (err) {
    next(err);
  }
});

// GET /api/dealer/activities — recent activity log
router.get('/activities', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    const activities = await prisma.dealerActivity.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { lead: { select: { buyerName: true, status: true } } },
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
