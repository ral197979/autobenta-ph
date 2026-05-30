const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const { analyzeListingWithAI } = require('../services/ai');
const storage = require('../services/storage/storageProvider');

const router = express.Router();
const prisma = new PrismaClient();

const LISTINGS_PER_PAGE = 20;

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
      lat, lng, radius,
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
    if (condition) where.condition = condition;
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
        listings: paginated,
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
      listings,
      pagination: { page: parseInt(page), total, pages: Math.ceil(total / LISTINGS_PER_PAGE), perPage: LISTINGS_PER_PAGE },
    });
  } catch (err) {
    next(err);
  }
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

    res.json({ ...listing, isFavorited });
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

module.exports = router;
