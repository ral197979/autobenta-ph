const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: { photos: { where: { isPrimary: true }, take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

router.post('/:listingId', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: req.params.listingId, status: 'active' },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const favorite = await prisma.favorite.upsert({
      where: { userId_listingId: { userId: req.user.id, listingId: req.params.listingId } },
      create: { userId: req.user.id, listingId: req.params.listingId },
      update: {},
    });
    res.status(201).json(favorite);
  } catch (err) {
    next(err);
  }
});

router.delete('/:listingId', authenticate, async (req, res, next) => {
  try {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId: req.user.id, listingId: req.params.listingId } },
    }).catch(() => {});
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
