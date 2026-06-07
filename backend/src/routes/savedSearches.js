const express = require('express');
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Translate a saved Browse-filter object into a Prisma where clause.
function buildWhere(filters = {}) {
  const where = { status: 'active' };
  if (filters.make) where.make = { contains: filters.make, mode: 'insensitive' };
  if (filters.model) where.model = { contains: filters.model, mode: 'insensitive' };
  if (filters.bodyType) where.bodyType = { contains: filters.bodyType, mode: 'insensitive' };
  if (filters.fuelType) where.fuelType = filters.fuelType;
  if (filters.transmission) where.transmission = filters.transmission;
  if (filters.sellerType) where.sellerType = filters.sellerType;
  if (filters.condition) where.condition = filters.condition;
  if (filters.location) where.city = { contains: filters.location, mode: 'insensitive' };
  if (filters.yearMin || filters.yearMax) where.year = { gte: filters.yearMin ? parseInt(filters.yearMin) : undefined, lte: filters.yearMax ? parseInt(filters.yearMax) : undefined };
  if (filters.priceMin || filters.priceMax) where.price = { gte: filters.priceMin ? parseFloat(filters.priceMin) : undefined, lte: filters.priceMax ? parseFloat(filters.priceMax) : undefined };
  if (filters.mileageMax) where.mileage = { lte: parseInt(filters.mileageMax) };
  if (filters.search) {
    where.OR = [
      { make: { contains: filters.search, mode: 'insensitive' } },
      { model: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

// GET /api/saved-searches — each search gets matchCount + newCount (since last seen)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const searches = await prisma.savedSearch.findMany({ where: { userId: req.user.id }, orderBy: { updatedAt: 'desc' } });
    const withCounts = await Promise.all(searches.map(async (s) => {
      const where = buildWhere(s.filters || {});
      const since = s.lastRun || s.createdAt;
      const [matchCount, newCount] = await Promise.all([
        prisma.vehicleListing.count({ where }),
        prisma.vehicleListing.count({ where: { ...where, createdAt: { gt: since } } }),
      ]);
      return { ...s, matchCount, newCount };
    }));
    res.json(withCounts);
  } catch (err) { next(err); }
});

// POST /api/saved-searches
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, filters, alertOn = true } = req.body;
    if (!name || !filters) return res.status(400).json({ error: 'name and filters required' });
    const search = await prisma.savedSearch.create({
      data: { userId: req.user.id, name, filters, alertOn, lastRun: new Date() },
    });
    res.status(201).json(search);
  } catch (err) { next(err); }
});

// PATCH /api/saved-searches/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
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
  } catch (err) { next(err); }
});

// POST /api/saved-searches/:id/seen — mark current matches as seen
router.post('/:id/seen', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const count = await prisma.vehicleListing.count({ where: buildWhere(existing.filters || {}) });
    const search = await prisma.savedSearch.update({ where: { id: req.params.id }, data: { lastRun: new Date(), resultCount: count } });
    res.json(search);
  } catch (err) { next(err); }
});

// DELETE /api/saved-searches/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await prisma.savedSearch.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
