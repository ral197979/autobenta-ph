const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Submit a financing pre-approval or insurance quote request (guest or logged-in)
router.post('/', optionalAuth, [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Name and a valid email are required' });
  try {
    const { type, name, email, phone, listingId, vehicleInfo, amount, details } = req.body;
    const lead = await prisma.partnerLead.create({
      data: {
        type: type === 'insurance' ? 'insurance' : 'financing',
        userId: req.user?.id || null,
        name, email, phone: phone || null,
        listingId: listingId || null,
        vehicleInfo: vehicleInfo || null,
        amount: amount != null && amount !== '' ? parseFloat(amount) : null,
        details: details || null,
      },
    });
    res.status(201).json({ ok: true, id: lead.id });
  } catch (e) { next(e); }
});

// List leads — admin sees all (optional ?type=), users see their own
router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const leads = await prisma.partnerLead.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (e) { next(e); }
});

// Update lead status (admin)
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'approved', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const updated = await prisma.partnerLead.update({ where: { id: req.params.id }, data: { status } });
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports = router;
