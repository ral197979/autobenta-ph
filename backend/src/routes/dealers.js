const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const dealers = await prisma.dealer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dealers);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        listings: {
          where: { status: 'active' },
          include: { photos: { where: { isPrimary: true }, take: 1 } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { listings: true, leads: true } },
      },
    });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
    res.json(dealer);
  } catch (err) {
    next(err);
  }
});

router.post('/register', authenticate, [
  body('businessName').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (existing) return res.status(409).json({ error: 'Dealer profile already exists' });

    const { businessName, description, address, city, logoUrl, website, licenseNumber } = req.body;
    const dealer = await prisma.dealer.create({
      data: { userId: req.user.id, businessName, description, address, city, logoUrl, website, licenseNumber },
    });

    await prisma.user.update({ where: { id: req.user.id }, data: { role: 'dealer' } });

    res.status(201).json(dealer);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

    const { businessName, description, address, city, website } = req.body;
    const updated = await prisma.dealer.update({
      where: { id: dealer.id },
      data: { businessName, description, address, city, website },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/me/leads', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const { status } = req.query;
    const where = { dealerId: dealer.id };
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
        inquiry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

router.patch('/me/leads/:leadId', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.leadId, dealerId: dealer?.id },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { status, notes } = req.body;
    const updated = await prisma.lead.update({
      where: { id: req.params.leadId },
      data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
