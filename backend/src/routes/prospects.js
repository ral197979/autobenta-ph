const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /admin/prospects
router.get('/admin/prospects', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { stage, search } = req.query;

    const where = {};
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { dealerName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prospects = await prisma.dealerProspect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { demoBookings: true } },
      },
    });

    res.json(prospects);
  } catch (err) {
    next(err);
  }
});

// POST /admin/prospects
router.post('/admin/prospects', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      dealerName, contactName, phone, email, location, branches,
      inventorySize, currentSystem, source, stage, owner,
      expectedMrr, closeProbability, notes,
    } = req.body;

    if (!dealerName) return res.status(400).json({ error: 'dealerName is required' });
    if (!contactName) return res.status(400).json({ error: 'contactName is required' });

    const prospect = await prisma.dealerProspect.create({
      data: {
        dealerName,
        contactName,
        phone,
        email,
        location,
        branches: branches || 1,
        inventorySize,
        currentSystem,
        source,
        stage: stage || 'prospect',
        owner,
        expectedMrr,
        closeProbability: closeProbability ?? 10,
        notes,
        activities: {
          create: {
            type: 'stage_changed',
            content: `Prospect created at stage: ${stage || 'prospect'}`,
            createdBy: req.user?.id,
          },
        },
      },
      include: { activities: true },
    });

    res.status(201).json(prospect);
  } catch (err) {
    next(err);
  }
});

// GET /admin/prospects/:id
router.get('/admin/prospects/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const prospect = await prisma.dealerProspect.findUnique({
      where: { id: req.params.id },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
        demoBookings: { orderBy: { scheduledAt: 'desc' } },
      },
    });

    if (!prospect) return res.status(404).json({ error: 'Not found' });
    res.json(prospect);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/prospects/:id
router.patch('/admin/prospects/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const existing = await prisma.dealerProspect.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const {
      dealerName, contactName, phone, email, location, branches,
      inventorySize, currentSystem, source, stage, owner,
      expectedMrr, closeProbability, notes, lostReason,
      nextFollowUpAt, status,
    } = req.body;

    const updates = {};
    if (dealerName !== undefined) updates.dealerName = dealerName;
    if (contactName !== undefined) updates.contactName = contactName;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (location !== undefined) updates.location = location;
    if (branches !== undefined) updates.branches = branches;
    if (inventorySize !== undefined) updates.inventorySize = inventorySize;
    if (currentSystem !== undefined) updates.currentSystem = currentSystem;
    if (source !== undefined) updates.source = source;
    if (owner !== undefined) updates.owner = owner;
    if (expectedMrr !== undefined) updates.expectedMrr = expectedMrr;
    if (closeProbability !== undefined) updates.closeProbability = closeProbability;
    if (notes !== undefined) updates.notes = notes;
    if (lostReason !== undefined) updates.lostReason = lostReason;
    if (nextFollowUpAt !== undefined) updates.nextFollowUpAt = new Date(nextFollowUpAt);
    if (status !== undefined) updates.status = status;

    const activityCreates = [];

    if (stage !== undefined && stage !== existing.stage) {
      updates.stage = stage;
      activityCreates.push({
        type: 'stage_changed',
        content: `Stage changed from ${existing.stage} to ${stage}`,
        createdBy: req.user?.id,
      });
      if (stage === 'won' && !existing.wonAt) {
        updates.wonAt = new Date();
      }
    }

    const prospect = await prisma.dealerProspect.update({
      where: { id: req.params.id },
      data: {
        ...updates,
        ...(activityCreates.length > 0 && {
          activities: { create: activityCreates },
        }),
      },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });

    res.json(prospect);
  } catch (err) {
    next(err);
  }
});

// POST /admin/prospects/:id/activities
router.post('/admin/prospects/:id/activities', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { type, content } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    if (!content) return res.status(400).json({ error: 'content is required' });

    const exists = await prisma.dealerProspect.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    const [activity] = await prisma.$transaction([
      prisma.prospectActivity.create({
        data: {
          prospectId: req.params.id,
          type,
          content,
          createdBy: req.user?.id,
        },
      }),
      prisma.dealerProspect.update({
        where: { id: req.params.id },
        data: { lastContactAt: new Date() },
      }),
    ]);

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/prospects/:id
router.delete('/admin/prospects/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.dealerProspect.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    await prisma.dealerProspect.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
