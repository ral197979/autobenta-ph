const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// List reviews for a seller — ?sellerId= (public)
router.get('/', async (req, res, next) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId) return res.status(400).json({ error: 'sellerId required' });
    const reviews = await prisma.review.findMany({
      where: { sellerId },
      include: { reviewer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const count = reviews.length;
    const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
    res.json({ reviews, count, average });
  } catch (e) { next(e); }
});

// Create a review (authenticated)
router.post('/', authenticate, [
  body('sellerId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { sellerId, rating, comment, listingId } = req.body;
    if (sellerId === req.user.id) return res.status(400).json({ error: 'You cannot review yourself' });
    const review = await prisma.review.create({
      data: { sellerId, reviewerId: req.user.id, rating: parseInt(rating), comment: comment || null, listingId: listingId || null },
      include: { reviewer: { select: { id: true, name: true } } },
    });
    res.status(201).json(review);
  } catch (e) { next(e); }
});

module.exports = router;
