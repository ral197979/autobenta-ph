const express = require('express');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const STAGES = ['saved', 'inquired', 'test_drive', 'negotiating'];

const cardInclude = {
  listing: {
    include: { photos: { where: { isPrimary: true }, take: 1 } },
  },
};

// GET /api/deal-tracker — all of the current user's pipeline cards
router.get('/', authenticate, async (req, res, next) => {
  try {
    const cards = await prisma.dealCard.findMany({
      where: { userId: req.user.id },
      include: cardInclude,
      orderBy: [{ stage: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(cards);
  } catch (err) { next(err); }
});

// POST /api/deal-tracker — add a listing to the pipeline
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { listingId, stage } = req.body;
    if (!listingId) return res.status(400).json({ error: 'listingId required' });
    const stageVal = STAGES.includes(stage) ? stage : 'saved';

    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const card = await prisma.dealCard.upsert({
      where: { userId_listingId: { userId: req.user.id, listingId } },
      create: { userId: req.user.id, listingId, stage: stageVal },
      update: {}, // already tracked — leave its stage untouched
      include: cardInclude,
    });
    res.status(201).json(card);
  } catch (err) { next(err); }
});

// PATCH /api/deal-tracker/:id — move stage / edit notes / reorder
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.dealCard.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });

    const { stage, notes, position } = req.body;
    if (stage !== undefined && !STAGES.includes(stage)) return res.status(400).json({ error: 'Invalid stage' });

    const card = await prisma.dealCard.update({
      where: { id: req.params.id },
      data: {
        ...(stage !== undefined ? { stage } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(position !== undefined ? { position } : {}),
      },
      include: cardInclude,
    });
    res.json(card);
  } catch (err) { next(err); }
});

// DELETE /api/deal-tracker/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.dealCard.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await prisma.dealCard.delete({ where: { id: req.params.id } });
    res.json({ message: 'Removed' });
  } catch (err) { next(err); }
});

module.exports = router;
