const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// List the current user's disputes (admins see all)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { reporterId: req.user.id };
    const disputes = await prisma.dispute.findMany({
      where,
      include: { reporter: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(disputes);
  } catch (e) { next(e); }
});

// File a dispute
router.post('/', authenticate, [
  body('category').trim().notEmpty(),
  body('subject').trim().notEmpty(),
  body('description').trim().isLength({ min: 10 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { category, subject, description, listingId } = req.body;
    const dispute = await prisma.dispute.create({
      data: { reporterId: req.user.id, category, subject, description, listingId: listingId || null },
    });
    res.status(201).json(dispute);
  } catch (e) { next(e); }
});

module.exports = router;
