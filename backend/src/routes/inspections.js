const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/request', authenticate, [
  body('listingId').notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { listingId, preferredDate, address, notes } = req.body;
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: listingId, status: 'active' },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const request = await prisma.inspectionRequest.create({
      data: {
        buyerId: req.user.id,
        listingId,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        address,
        notes,
      },
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'inspector';
    const where = isAdmin ? {} : { buyerId: req.user.id };

    const requests = await prisma.inspectionRequest.findMany({
      where,
      include: {
        listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        report: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const request = await prisma.inspectionRequest.findUnique({
      where: { id: req.params.id },
      include: {
        listing: { include: { photos: true, seller: { select: { id: true, name: true, phone: true } } } },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        report: true,
      },
    });
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (request.buyerId !== req.user.id && !['admin', 'inspector'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, requireRole('admin', 'inspector'), async (req, res, next) => {
  try {
    const updated = await prisma.inspectionRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/report', authenticate, requireRole('admin', 'inspector'), [
  body('overallScore').isInt({ min: 0, max: 100 }),
  body('result').isIn(['pass', 'warning', 'fail']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    overallScore, result, exterior, interior, engine, transmission,
    suspension, tires, electrical, floodSigns, accidentSigns, testDriveNotes, photos,
  } = req.body;

  try {
    const report = await prisma.inspectionReport.create({
      data: {
        requestId: req.params.id,
        inspectorId: req.user.id,
        overallScore,
        result,
        exterior: exterior || {},
        interior: interior || {},
        engine: engine || {},
        transmission: transmission || {},
        suspension: suspension || {},
        tires: tires || {},
        electrical: electrical || {},
        floodSigns: floodSigns || {},
        accidentSigns: accidentSigns || {},
        testDriveNotes,
        photos,
      },
    });

    await prisma.inspectionRequest.update({
      where: { id: req.params.id },
      data: { status: 'completed' },
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
