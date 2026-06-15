const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const include = {
  listing: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
  buyer: { select: { id: true, name: true, phone: true } },
  seller: { select: { id: true, name: true, phone: true } },
};

// Book a test drive / viewing (buyer)
router.post('/', authenticate, [
  body('listingId').notEmpty(),
  body('preferredDate').notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { listingId, type, preferredDate, timeSlot, message } = req.body;
    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId === req.user.id) return res.status(400).json({ error: 'You cannot book your own listing' });

    const booking = await prisma.booking.create({
      data: {
        listingId,
        buyerId: req.user.id,
        sellerId: listing.sellerId,
        type: type === 'viewing' ? 'viewing' : 'test_drive',
        preferredDate: new Date(preferredDate),
        timeSlot: timeSlot || null,
        message: message || null,
      },
      include,
    });
    res.status(201).json(booking);
  } catch (e) { next(e); }
});

// List bookings — ?box=sent|received
router.get('/', authenticate, async (req, res, next) => {
  try {
    const box = req.query.box === 'received' ? 'received' : 'sent';
    const where = box === 'received' ? { sellerId: req.user.id } : { buyerId: req.user.id };
    const bookings = await prisma.booking.findMany({ where, include, orderBy: { preferredDate: 'asc' } });
    res.json(bookings);
  } catch (e) { next(e); }
});

// Act on a booking — { action: confirm|decline|cancel|complete }
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { action } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const isSeller = booking.sellerId === req.user.id;
    const isBuyer = booking.buyerId === req.user.id;
    if (!isSeller && !isBuyer) return res.status(403).json({ error: 'Not authorized' });

    let status;
    if (action === 'confirm' || action === 'decline') {
      if (!isSeller) return res.status(403).json({ error: 'Only the seller can do that' });
      status = action === 'confirm' ? 'confirmed' : 'declined';
    } else if (action === 'complete') {
      if (!isSeller) return res.status(403).json({ error: 'Only the seller can do that' });
      status = 'completed';
    } else if (action === 'cancel') {
      if (!isBuyer) return res.status(403).json({ error: 'Only the buyer can cancel' });
      status = 'cancelled';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status }, include });
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports = router;
