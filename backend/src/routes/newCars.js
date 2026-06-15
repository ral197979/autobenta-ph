const express = require('express');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// PDF brochure uploads (the shared upload middleware is image-only).
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const brochureDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(brochureDir)) fs.mkdirSync(brochureDir, { recursive: true });
const brochureUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, brochureDir),
    filename: (req, file, cb) => cb(null, `brochure-${uuidv4()}.pdf`),
  }),
  fileFilter: (req, file, cb) =>
    path.extname(file.originalname).toLowerCase() === '.pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'), false),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const MODEL_FIELDS = ['make', 'model', 'bodyType', 'fuelType', 'year', 'imageUrl', 'brochureUrl', 'description', 'isElectric', 'isFeatured', 'specs'];

function buildModelData(body) {
  const data = {};
  for (const k of MODEL_FIELDS) if (body[k] !== undefined) data[k] = body[k];
  if (body.year !== undefined) data.year = parseInt(body.year);
  if (body.startingPrice !== undefined) data.startingPrice = parseFloat(body.startingPrice);
  return data;
}

const cleanVariants = (variants) =>
  (Array.isArray(variants) ? variants : [])
    .filter((v) => v && v.name && v.price != null)
    .map((v) => ({ name: v.name, price: parseFloat(v.price), transmission: v.transmission || null, fuelType: v.fuelType || null }));

// List new-car models with filters + pagination (public)
router.get('/', async (req, res, next) => {
  try {
    const { make, bodyType, fuelType, priceMin, priceMax, electric, sort = 'featured', page = 1, limit = 24 } = req.query;
    const where = {};
    if (make) where.make = { equals: make, mode: 'insensitive' };
    if (bodyType) where.bodyType = { contains: bodyType, mode: 'insensitive' };
    if (fuelType) where.fuelType = { equals: fuelType, mode: 'insensitive' };
    if (electric === 'true') where.isElectric = true;
    if (req.query.green === 'true') where.OR = [{ isElectric: true }, { fuelType: 'hybrid' }];
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

// --- Admin CRUD ---

// Create a model (+ variants)
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { make, model, bodyType, fuelType, startingPrice, year } = req.body;
    if (!make || !model || !bodyType || !fuelType || startingPrice == null || year == null) {
      return res.status(400).json({ error: 'make, model, bodyType, fuelType, startingPrice, and year are required' });
    }
    const created = await prisma.newCarModel.create({
      data: { ...buildModelData(req.body), startingPrice: parseFloat(startingPrice), variants: { create: cleanVariants(req.body.variants) } },
      include: { variants: true },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// Update a model; if `variants` provided, replace them
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.newCarModel.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Model not found' });
    if (Array.isArray(req.body.variants)) {
      await prisma.newCarVariant.deleteMany({ where: { modelId: req.params.id } });
    }
    const updated = await prisma.newCarModel.update({
      where: { id: req.params.id },
      data: {
        ...buildModelData(req.body),
        ...(req.body.startingPrice !== undefined && { startingPrice: parseFloat(req.body.startingPrice) }),
        ...(Array.isArray(req.body.variants) && { variants: { create: cleanVariants(req.body.variants) } }),
      },
      include: { variants: true },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// Delete a model (variants cascade)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.newCarModel.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/new-cars/brochure — admin uploads a PDF brochure, returns its URL
router.post('/brochure', authenticate, requireRole('admin'), (req, res, next) => {
  brochureUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
