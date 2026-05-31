const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /dealer/billing/invoices — authenticated dealer, returns their invoices
router.get('/dealer/billing/invoices', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const invoices = await prisma.invoice.findMany({
      where: { dealerId: dealer.id },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// GET /dealer/billing/invoices/:invoiceId — single invoice with payment records
router.get('/dealer/billing/invoices/:invoiceId', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.invoiceId, dealerId: dealer.id },
      include: { payments: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// POST /admin/billing/invoices — admin creates invoice for a dealer
router.post('/admin/billing/invoices', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { dealerId, amount, plan, billingCycle, periodStart, periodEnd, dueAt } = req.body;

    if (!dealerId || amount === undefined) {
      return res.status(400).json({ error: 'dealerId and amount are required' });
    }

    const invoiceNumber = `INV-${Date.now()}-${dealerId.slice(0, 6).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        dealerId,
        invoiceNumber,
        amount,
        plan,
        billingCycle,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        dueAt: dueAt ? new Date(dueAt) : undefined,
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/billing/invoices/:id — admin updates invoice status
router.patch('/admin/billing/invoices/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, paidAt, metadata } = req.body;
    const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'void'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(paidAt && { paidAt: new Date(paidAt) }),
        ...(status === 'paid' && !paidAt && { paidAt: new Date() }),
        ...(metadata !== undefined && { metadata }),
      },
      include: { payments: true },
    });

    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// GET /admin/billing/invoices — admin list all invoices with optional filters
router.get('/admin/billing/invoices', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { dealerId, status } = req.query;
    const where = {
      ...(dealerId && { dealerId }),
      ...(status && { status }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        dealer: {
          select: { id: true, businessName: true, user: { select: { name: true, email: true } } },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
