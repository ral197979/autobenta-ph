const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticate, [
  body('listingId').notEmpty(),
  body('message').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { listingId, message, contactPhone } = req.body;
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: listingId, status: 'active' },
      include: { dealer: true },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId === req.user.id) {
      return res.status(400).json({ error: 'Cannot inquire about your own listing' });
    }

    const inquiry = await prisma.inquiry.create({
      data: { buyerId: req.user.id, listingId, message, contactPhone },
    });

    await prisma.vehicleListing.update({
      where: { id: listingId },
      data: { inquiryCount: { increment: 1 } },
    });

    if (listing.dealer) {
      const lead = await prisma.lead.create({
        data: {
          dealerId: listing.dealer.id,
          inquiryId: inquiry.id,
          listingId,
          buyerName: req.user.name,
          buyerEmail: req.user.email,
          buyerPhone: contactPhone,
        },
      });

      const { dispatchWebhook } = require('../services/webhookDispatcher');
      dispatchWebhook(lead.dealerId, 'lead.created', {
        lead: {
          id:       lead.id,
          source:   'ryderr_marketplace',
          listing:  { id: listing.id, make: listing.make, model: listing.model, year: listing.year },
          buyer:    { name: lead.buyerName, email: lead.buyerEmail, phone: lead.buyerPhone },
          message:  inquiry.message,
          createdAt: lead.createdAt,
        },
      }).catch(() => {}); // fire-and-forget, never block the response
    }

    res.status(201).json(inquiry);
  } catch (err) {
    next(err);
  }
});

router.get('/received', authenticate, async (req, res, next) => {
  try {
    const listings = await prisma.vehicleListing.findMany({
      where: { sellerId: req.user.id },
      select: { id: true },
    });
    const listingIds = listings.map(l => l.id);

    const inquiries = await prisma.inquiry.findMany({
      where: { listingId: { in: listingIds } },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        listing: { select: { id: true, make: true, model: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inquiries);
  } catch (err) {
    next(err);
  }
});

router.get('/sent', authenticate, async (req, res, next) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { buyerId: req.user.id },
      include: {
        listing: {
          include: { photos: { where: { isPrimary: true }, take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inquiries);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    if (inquiry.listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { status: req.body.status, isRead: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
