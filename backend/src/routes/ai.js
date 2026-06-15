const express = require('express');
const prisma = require("../lib/prisma");
const { optionalAuth } = require('../middleware/auth');
const aiService = require('../services/ai');

const router = express.Router();

router.get('/listing/:listingId/analysis', optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: req.params.listingId },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const existing = await prisma.aIAnalysis.findFirst({
      where: { listingId: req.params.listingId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) return res.json(existing);

    const analysis = await aiService.analyzeListingWithAI(req.params.listingId);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

router.post('/price-estimate', async (req, res, next) => {
  try {
    const { make, model, year, mileage, condition, fuelType, transmission } = req.body;
    const estimate = await aiService.estimatePrice({ make, model, year, mileage, condition, fuelType, transmission });
    res.json(estimate);
  } catch (err) {
    next(err);
  }
});

router.post('/buyer-assistant', optionalAuth, async (req, res, next) => {
  try {
    const { question, listingId, compareIds } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    let listing = null;
    if (listingId) {
      listing = await prisma.vehicleListing.findUnique({
        where: { id: listingId },
        include: { photos: { where: { isPrimary: true }, take: 1 }, aiAnalyses: { take: 1 } },
      });
    }

    let compareListings = [];
    if (compareIds?.length) {
      compareListings = await prisma.vehicleListing.findMany({
        where: { id: { in: compareIds } },
      });
    }

    const answer = await aiService.buyerAssistant({ question, listing, compareListings });
    res.json(answer);
  } catch (err) {
    next(err);
  }
});

router.post('/fraud-check/:listingId', async (req, res, next) => {
  try {
    const listing = await prisma.vehicleListing.findUnique({ where: { id: req.params.listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const result = await aiService.checkFraud(listing);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
