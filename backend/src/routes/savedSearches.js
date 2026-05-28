const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/saved-searches
router.get('/', authenticate, async (req, res, next) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(searches);
  } catch (err) {
    next(err);
  }
});

// POST /api/saved-searches
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, filters, alertOn = false } = req.body;
    if (!name || !filters) return res.status(400).json({ error: 'name and filters required' });

    const search = await prisma.savedSearch.create({
      data: { userId: req.user.id, name, filters, alertOn },
    });
    res.status(201).json(search);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/saved-searches/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { name, filters, alertOn } = req.body;
    const search = await prisma.savedSearch.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(filters !== undefined ? { filters } : {}),
        ...(alertOn !== undefined ? { alertOn } : {}),
      },
    });
    res.json(search);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved-searches/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    await prisma.savedSearch.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
