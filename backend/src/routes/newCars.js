const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// List new-car models with filters + pagination (public)
router.get('/', async (req, res, next) => {
  try {
    const { make, bodyType, fuelType, priceMin, priceMax, electric, sort = 'featured', page = 1, limit = 24 } = req.query;
    const where = {};
    if (make) where.make = { equals: make, mode: 'insensitive' };
    if (bodyType) where.bodyType = { contains: bodyType, mode: 'insensitive' };
    if (fuelType) where.fuelType = { equals: fuelType, mode: 'insensitive' };
    if (electric === 'true') where.isElectric = true;
    if (priceMin || priceMax) where.startingPrice = { gte: priceMin ? parseFloat(priceMin) : undefined, lte: priceMax ? parseFloat(priceMax) : undefined };

    const orderBy =
      sort === 'price_asc' ? { startingPrice: 'asc' } :
      sort === 'price_desc' ? { startingPrice: 'desc' } :
      sort === 'newest' ? { createdAt: 'desc' } :
      [{ isFeatured: 'desc' }, { make: 'asc' }, { model: 'asc' }];

    const take = Math.min(parseInt(limit) || 24, 60);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const [models, total] = await Promise.all([
      prisma.newCarModel.findMany({ where, orderBy, take, skip, include: { _count: { select: { variants: true } } } }),
      prisma.newCarModel.count({ where }),
    ]);

    res.json({ models, pagination: { total, page: parseInt(page) || 1, pages: Math.ceil(total / take) } });
  } catch (e) { next(e); }
});

// Distinct makes (for filters)
router.get('/makes', async (_req, res, next) => {
  try {
    const rows = await prisma.newCarModel.findMany({ distinct: ['make'], select: { make: true }, orderBy: { make: 'asc' } });
    res.json(rows.map((r) => r.make));
  } catch (e) { next(e); }
});

// Model detail + variants
router.get('/:id', async (req, res, next) => {
  try {
    const model = await prisma.newCarModel.findUnique({
      where: { id: req.params.id },
      include: { variants: { orderBy: { price: 'asc' } } },
    });
    if (!model) return res.status(404).json({ error: 'Model not found' });
    res.json(model);
  } catch (e) { next(e); }
});

module.exports = router;
