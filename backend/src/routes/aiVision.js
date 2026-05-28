const express = require('express');
const { authenticate } = require('../middleware/auth');
const { generateListingDraft } = require('../services/aiVision/listingDraftGenerator');
const { aiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// POST /api/ai-vision/draft — generate listing draft from image URLs
router.post('/draft', authenticate, aiLimiter, async (req, res, next) => {
  try {
    const { imageUrls } = req.body;
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({ error: 'imageUrls array required' });
    }
    const draft = await generateListingDraft(imageUrls);
    res.json(draft);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
