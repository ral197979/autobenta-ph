const express = require('express');
const { body, query, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const { analyzeListingWithAI } = require('../services/ai');
const storage = require('../services/storage/storageProvider');

const router = express.Router();

const LISTINGS_PER_PAGE = 20;

// Attach a market-based "Deal Rating" to each listing by comparing its price to
// the average of active listings of the same make+model (min 3 comps).
async function withDealRatings(listings) {
  if (!listings.length) return listings;
  const groups = await prisma.vehicleListing.groupBy({
    by: ['make', 'model'],
    where: { status: 'active' },
    _avg: { price: true },
    _count: { _all: true },
  });
  const key = (mk, md) => `${mk}|${md}`.toLowerCase();
  const avgMap = {};
  groups.forEach((g) => { if (g._count._all >= 3 && g._avg.price) avgMap[key(g.make, g.model)] = Number(g._avg.price); });
  return listings.map((l) => {
    const avg = avgMap[key(l.make, l.model)];
    if (!avg) return l;
    const r = Number(l.price) / avg;
    const rating = r <= 0.93 ? 'great' : r <= 1.0 ? 'good' : r <= 1.1 ? 'fair' : 'high';
    return { ...l, dealRating: rating, marketAvg: Math.round(avg) };
  });
}

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1, make, model, yearMin, yearMax, priceMin, priceMax,
      mileageMax, fuelType, transmission, location, sellerType,
      condition, sortBy = 'createdAt', sortOrder = 'desc', search,
      lat, lng, radius, verified,
    } = req.query;

    const nearbyMode = lat && lng;
    const userLat = nearbyMode ? parseFloat(lat) : null;
    const userLng = nearbyMode ? parseFloat(lng) : null;
    const radiusKm = radius ? parseFloat(radius) : 100;

    const where = { status: 'active' };
    if (make) where.make = { contains: make, mode: 'insensitive' };
    if (model) where.model = { contains: model, mode: 'insensitive' };
    if (yearMin || yearMax) where.year = { gte: yearMin ? parseInt(yearMin) : undefined, lte: yearMax ? parseInt(yearMax) : undefined };
    if (priceMin || priceMax) where.price = { gte: priceMin ? parseFloat(priceMin) : undefined, lte: priceMax ? parseFloat(priceMax) : undefined };
    if (mileageMax) where.mileage = { lte: parseInt(mileageMax) };
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;
    // In nearby mode, skip city text filter — distance radius takes over
    if (location && !nearbyMode) where.city = { contains: location, mode: 'insensitive' };
    if (sellerType) where.sellerType = sellerType;
    if (req.query.sellerId) where.sellerId = req.query.sellerId;
    if (req.query.bodyType) where.bodyType = { contains: req.query.bodyType, mode: 'insensitive' };
    if (condition) where.condition = condition;
    if (verified === 'true') {
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: [{ sellerVerified: true }, { dealer: { isVerified: true } }] });
    }
    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (nearbyMode) {
      // Fetch all matching listings (no pagination yet — filter by distance in JS)
      const all = await prisma.vehicleListing.findMany({
        where,
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          seller: { select: { id: true, name: true, role: true } },
          dealer: { select: { id: true, businessName: true, isVerified: true } },
        },
        orderBy: [{ isSponsored: 'desc' }],
        take: 500,
      });

      // Annotate with distance and filter by radius
      const withDist = all
        .map((l) => ({ ...l, distanceKm: haversineKm(userLat, userLng, l.lat, l.lng) }))
        .filter((l) => l.distanceKm != null && l.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * LISTINGS_PER_PAGE;
      const paginated = withDist.slice(skip, skip + LISTINGS_PER_PAGE);

      return res.json({
        listings: await withDealRatings(paginated),
        pagination: { page: pageNum, total: withDist.length, pages: Math.ceil(withDist.length / LISTINGS_PER_PAGE), perPage: LISTINGS_PER_PAGE },
        nearbyMode: true,
      });
    }

    const skip = (parseInt(page) - 1) * LISTINGS_PER_PAGE;
    const [listings, total] = await Promise.all([
      prisma.vehicleListing.findMany({
        where,
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          seller: { select: { id: true, name: true, role: true } },
          dealer: { select: { id: true, businessName: true, isVerified: true } },
        },
        orderBy: [{ isSponsored: 'desc' }, { [sortBy]: sortOrder }],
        skip,
        take: LISTINGS_PER_PAGE,
      }),
      prisma.vehicleListing.count({ where }),
    ]);

    res.json({
      listings: await withDealRatings(listings),
      pagination: { page: parseInt(page), total, pages: Math.ceil(total / LISTINGS_PER_PAGE), perPage: LISTINGS_PER_PAGE },
    });
  } catch (err) {
    next(err);
  }
});

// Facets for the homepage hero search: makes (with their models) and price range,
// derived from live active inventory so users can't pick a zero-result combo.
router.get('/facets', async (req, res, next) => {
  try {
    const groups = await prisma.vehicleListing.groupBy({
      by: ['make', 'model'],
      where: { status: 'active' },
      _count: { _all: true },
    });
    const makeMap = new Map();
    for (const g of groups) {
      if (!g.make) continue;
      if (!makeMap.has(g.make)) makeMap.set(g.make, { make: g.make, count: 0, models: [] });
      const entry = makeMap.get(g.make);
      entry.count += g._count._all;
      if (g.model) entry.models.push({ model: g.model, count: g._count._all });
    }
    const makes = [...makeMap.values()]
      .sort((a, b) => b.count - a.count || a.make.localeCompare(b.make))
      .map((m) => ({ ...m, models: m.models.sort((a, b) => a.model.localeCompare(b.model)) }));

    const agg = await prisma.vehicleListing.aggregate({
      where: { status: 'active' },
      _min: { price: true },
      _max: { price: true },
    });

    const cityGroups = await prisma.vehicleListing.groupBy({
      by: ['city'],
      where: { status: 'active' },
      _count: { _all: true },
    });
    const cities = cityGroups
      .filter((c) => c.city)
      .map((c) => ({ city: c.city, count: c._count._all }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));

    res.json({
      makes,
      cities,
      priceRange: { min: Number(agg._min.price) || 0, max: Number(agg._max.price) || 0 },
    });
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: req.params.id },
      include: {
        photos: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        seller: { select: { id: true, name: true, phone: true, role: true, createdAt: true } },
        dealer: { select: { id: true, businessName: true, city: true, logoUrl: true, isVerified: true, website: true } },
        inspectionRequests: {
          where: { status: 'completed' },
          include: { report: true },
          take: 1,
        },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.status !== 'active' && listing.sellerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await prisma.vehicleListing.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    const isFavorited = req.user
      ? !!(await prisma.favorite.findUnique({ where: { userId_listingId: { userId: req.user.id, listingId: req.params.id } } }))
      : false;

    const [rated] = await withDealRatings([listing]);
    res.json({ ...rated, isFavorited });
  } catch (err) {
    next(err);
  }
});

// GET /api/listings/:id/similar — active listings like this one (make/body, ±30% price)
router.get('/:id/similar', async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const price = Number(listing.price) || 0;
    const or = [];
    if (listing.bodyType) or.push({ bodyType: listing.bodyType });
    if (listing.make) or.push({ make: listing.make });

    const where = {
      status: 'active',
      id: { not: listing.id },
      ...(price ? { price: { gte: price * 0.7, lte: price * 1.3 } } : {}),
      ...(or.length ? { OR: or } : {}),
    };

    const candidates = await prisma.vehicleListing.findMany({
      where,
      include: { photos: { where: { isPrimary: true }, take: 1 } },
      take: 24,
      orderBy: { createdAt: 'desc' },
    });

    // Rank: same make + same body type first, then closest price.
    candidates.sort((a, b) => {
      const score = (l) => (l.make === listing.make ? 2 : 0) + (l.bodyType === listing.bodyType ? 1 : 0);
      const s = score(b) - score(a);
      if (s) return s;
      return Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price);
    });

    res.json(await withDealRatings(candidates.slice(0, 6)));
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('seller', 'dealer', 'admin'), [
  body('make').trim().notEmpty(),
  body('model').trim().notEmpty(),
  body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
  body('mileage').isInt({ min: 0 }),
  body('price').isFloat({ min: 0 }),
  body('fuelType').isIn(['gasoline', 'diesel', 'hybrid', 'electric', 'lpg']),
  body('transmission').isIn(['automatic', 'manual', 'cvt']),
  body('location').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('region').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dealer = req.user.role === 'dealer'
      ? await prisma.dealer.findUnique({ where: { userId: req.user.id } })
      : null;

    const listing = await prisma.vehicleListing.create({
      data: {
        ...req.body,
        sellerId: req.user.id,
        dealerId: dealer?.id || null,
        sellerType: dealer ? 'dealer' : req.body.sellerType || 'private',
        status: 'pending',
        year: parseInt(req.body.year),
        mileage: parseInt(req.body.mileage),
        price: parseFloat(req.body.price),
      },
    });

    analyzeListingWithAI(listing.id).catch(console.error);

    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatable = ['make', 'model', 'year', 'variant', 'plateEnding', 'mileage', 'price',
      'negotiable', 'fuelType', 'transmission', 'color', 'bodyType', 'location', 'city', 'region',
      'condition', 'description', 'hasOrCr', 'orCrNotes', 'ownerCount', 'serviceHistory',
      'serviceNotes', 'hasAccident', 'accidentNotes', 'hasFlood', 'floodNotes'];

    const data = {};
    for (const key of updatable) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (req.body.status && ['draft', 'archived', 'sold'].includes(req.body.status)) {
      data.status = req.body.status;
      if (req.body.status === 'sold') data.soldAt = new Date();
    }

    const updated = await prisma.vehicleListing.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.vehicleListing.update({
      where: { id: req.params.id },
      data: { status: 'archived' },
    });
    res.json({ message: 'Listing archived' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/photos', authenticate, upload.array('photos', 20), async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const existingCount = await prisma.vehiclePhoto.count({ where: { listingId: req.params.id } });
    const photos = await Promise.all(
      req.files.map(async (file, idx) => {
        const saved = await storage.saveFile(file);
        return prisma.vehiclePhoto.create({
          data: {
            listingId: req.params.id,
            url: saved.url,
            storageKey: saved.storageKey,
            provider: saved.provider,
            isPrimary: existingCount === 0 && idx === 0,
            sortOrder: existingCount + idx,
            sizeBytes: file.size,
          },
        });
      })
    );

    res.status(201).json(photos);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/photos/:photoId', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: req.params.id } });
    if (!listing || (listing.sellerId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const photo = await prisma.vehiclePhoto.findUnique({ where: { id: req.params.photoId } });
    if (photo?.storageKey) {
      await storage.deleteFile(photo.storageKey).catch(() => {});
    }
    await prisma.vehiclePhoto.delete({ where: { id: req.params.photoId } });
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/user/my-listings', authenticate, async (req, res, next) => {
  try {
    const listings = await prisma.vehicleListing.findMany({
      where: { sellerId: req.user.id },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        _count: { select: { inquiries: true, favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err) {
    next(err);
  }
});

// Requires: npm install csv-parse
// CSV inventory importer
let csvParse = null;
try { csvParse = require('csv-parse/sync'); } catch (_) { /* csv-parse not installed */ }

const csvUpload = require('multer')({ storage: require('multer').memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/import/csv', authenticate, requireRole('dealer', 'admin'), csvUpload.single('file'), async (req, res, next) => {
  try {
    if (!csvParse) return res.status(501).json({ error: 'csv-parse package not installed. Run: npm install csv-parse' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(403).json({ error: 'Not a dealer' });

    const text = req.file.buffer.toString('utf-8');
    const records = csvParse.parse(text, { columns: true, skip_empty_lines: true, trim: true });

    const results = { created: 0, errors: [] };
    for (const [i, row] of records.entries()) {
      try {
        const make = row.make || row.Make || row.MAKE;
        const model = row.model || row.Model || row.MODEL;
        const year = parseInt(row.year || row.Year);
        const price = parseFloat(row.price || row.Price);
        const mileage = parseInt(row.mileage || row.Mileage);

        if (!make || !model || !year || !price || isNaN(mileage)) {
          results.errors.push({ row: i + 2, error: 'Missing required field (make, model, year, price, mileage)' });
          continue;
        }

        await prisma.vehicleListing.create({
          data: {
            sellerId: req.user.id,
            dealerId: dealer.id,
            sellerType: 'dealer',
            status: 'draft',
            make, model, year, price, mileage,
            variant: row.variant || row.Variant || null,
            color: row.color || row.Color || null,
            fuelType: (row.fuelType || row.fuel_type || 'gasoline').toLowerCase(),
            transmission: (row.transmission || row.Transmission || 'automatic').toLowerCase(),
            condition: (row.condition || row.Condition || 'good').toLowerCase(),
            description: row.description || row.Description || null,
            city: row.city || row.City || dealer.city,
            region: row.region || row.Region || '',
            location: row.location || row.Location || dealer.address || '',
          },
        });
        results.created++;
      } catch (err) {
        results.errors.push({ row: i + 2, error: err.message });
      }
    }

    res.json({ ...results, total: records.length, message: `Imported ${results.created} listings as drafts` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
