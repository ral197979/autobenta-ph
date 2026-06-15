const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const listingInclude = {
  listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
  buyer: { select: { id: true, name: true, phone: true } },
  seller: { select: { id: true, name: true, phone: true } },
};

// Create an offer (buyer)
router.post('/', authenticate, [
  body('listingId').notEmpty(),
  body('amount').isFloat({ gt: 0 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { listingId, amount, message } = req.body;
    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId === req.user.id) return res.status(400).json({ error: 'You cannot make an offer on your own listing' });

    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId: req.user.id,
        sellerId: listing.sellerId,
        amount: parseFloat(amount),
        message: message || null,
      },
      include: listingInclude,
    });
    res.status(201).json(offer);
  } catch (e) { next(e); }
});

// List offers — ?box=sent|received
router.get('/', authenticate, async (req, res, next) => {
  try {
    const box = req.query.box === 'received' ? 'received' : 'sent';
    const where = box === 'received' ? { sellerId: req.user.id } : { buyerId: req.user.id };
    const offers = await prisma.offer.findMany({ where, include: listingInclude, orderBy: { updatedAt: 'desc' } });
    res.json(offers);
  } catch (e) { next(e); }
});

// Act on an offer — { action: accept|decline|counter|withdraw, counterAmount? }
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { action, counterAmount } = req.body;
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const isSeller = offer.sellerId === req.user.id;
    const isBuyer = offer.buyerId === req.user.id;
    if (!isSeller && !isBuyer) return res.status(403).json({ error: 'Not authorized' });
    if (['accepted', 'declined', 'withdrawn'].includes(offer.status)) {
      return res.status(400).json({ error: `Offer already ${offer.status}` });
    }

    let data;
    switch (action) {
      case 'accept':
        // Seller accepts a pending offer, or buyer accepts a counter.
        if (offer.status === 'pending' && !isSeller) return res.status(403).json({ error: 'Only the seller can accept this offer' });
        if (offer.status === 'countered' && !isBuyer) return res.status(403).json({ error: 'Only the buyer can accept the counter' });
        data = { status: 'accepted' };
        break;
      case 'decline':
        data = { status: 'declined' };
        break;
      case 'counter':
        if (!isSeller) return res.status(403).json({ error: 'Only the seller can counter' });
        if (!(parseFloat(counterAmount) > 0)) return res.status(400).json({ error: 'Valid counterAmount required' });
        data = { status: 'countered', counterAmount: parseFloat(counterAmount) };
        break;
      case 'withdraw':
        if (!isBuyer) return res.status(403).json({ error: 'Only the buyer can withdraw' });
        data = { status: 'withdrawn' };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const updated = await prisma.offer.update({ where: { id: offer.id }, data, include: listingInclude });
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports = router;
