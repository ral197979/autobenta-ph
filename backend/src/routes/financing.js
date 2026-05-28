const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const calculateMonthlyPayment = (principal, annualRate, months) => {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

const estimateRate = (incomeRange) => {
  const rateMap = {
    'under_30k': 9.5,
    '30k_50k': 8.5,
    '50k_100k': 7.5,
    '100k_above': 6.5,
  };
  return rateMap[incomeRange] || 8.5;
};

router.post('/request', authenticate, [
  body('listingId').notEmpty(),
  body('vehiclePrice').isFloat({ min: 0 }),
  body('downPayment').isFloat({ min: 0 }),
  body('termMonths').isInt({ min: 12, max: 72 }),
  body('incomeRange').isIn(['under_30k', '30k_50k', '50k_100k', '100k_above']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { listingId, vehiclePrice, downPayment, termMonths, incomeRange, employmentType } = req.body;
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const loanAmount = parseFloat(vehiclePrice) - parseFloat(downPayment);
    if (loanAmount <= 0) return res.status(400).json({ error: 'Down payment exceeds vehicle price' });

    const rate = estimateRate(incomeRange);
    const monthly = calculateMonthlyPayment(loanAmount, rate, parseInt(termMonths));

    const request = await prisma.financingRequest.create({
      data: {
        buyerId: req.user.id,
        listingId,
        vehiclePrice: parseFloat(vehiclePrice),
        downPayment: parseFloat(downPayment),
        loanAmount,
        termMonths: parseInt(termMonths),
        incomeRange,
        employmentType,
        monthlyPayment: Math.round(monthly * 100) / 100,
        status: 'requested',
      },
    });

    res.status(201).json({
      ...request,
      estimatedRate: rate,
      estimatedMonthly: Math.round(monthly * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/my-requests', authenticate, async (req, res, next) => {
  try {
    const requests = await prisma.financingRequest.findMany({
      where: { buyerId: req.user.id },
      include: {
        listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const requests = await prisma.financingRequest.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const updated = await prisma.financingRequest.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/calculate', async (req, res) => {
  const { vehiclePrice, downPayment, termMonths, incomeRange } = req.body;
  const loanAmount = parseFloat(vehiclePrice) - parseFloat(downPayment);
  const rate = estimateRate(incomeRange || '30k_50k');
  const monthly = calculateMonthlyPayment(loanAmount, rate, parseInt(termMonths));
  res.json({
    loanAmount: Math.round(loanAmount * 100) / 100,
    estimatedRate: rate,
    estimatedMonthly: Math.round(monthly * 100) / 100,
    totalPayment: Math.round(monthly * parseInt(termMonths) * 100) / 100,
    totalInterest: Math.round((monthly * parseInt(termMonths) - loanAmount) * 100) / 100,
  });
});

module.exports = router;
