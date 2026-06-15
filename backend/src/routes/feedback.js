const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate } = require('../middleware/auth');


// POST /feedback/feature-requests — optional auth
router.post('/feedback/feature-requests', async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!description) return res.status(400).json({ error: 'description is required' });

    // Try to extract dealerId from token if present
    let dealerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (decoded?.dealerId) dealerId = decoded.dealerId;
      } catch {
        // optional auth — ignore invalid token
      }
    }

    const request = await prisma.featureRequest.create({
      data: { title, description, dealerId },
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// POST /feedback/dealer-feedback — requires auth
router.post('/feedback/dealer-feedback', authenticate, async (req, res, next) => {
  try {
    const { category, rating, content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const dealerId = req.user?.dealerId || null;

    const feedback = await prisma.dealerFeedback.create({
      data: {
        dealerId,
        category: category || 'general',
        rating: rating !== undefined ? parseInt(rating, 10) : null,
        content,
      },
    });

    res.status(201).json(feedback);
  } catch (err) {
    next(err);
  }
});

// POST /feedback/support — requires auth
router.post('/feedback/support', authenticate, async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required' });
    if (!description) return res.status(400).json({ error: 'description is required' });

    const dealerId = req.user?.dealerId || null;

    const ticket = await prisma.supportTicket.create({
      data: {
        dealerId,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'normal',
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /feedback/nps — optional auth
router.post('/feedback/nps', async (req, res, next) => {
  try {
    const { score, comment } = req.body;
    if (score === undefined || score === null) return res.status(400).json({ error: 'score is required' });
    const numScore = parseInt(score, 10);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      return res.status(400).json({ error: 'score must be between 0 and 10' });
    }

    let dealerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (decoded?.dealerId) dealerId = decoded.dealerId;
      } catch {
        // optional auth — ignore invalid token
      }
    }

    const nps = await prisma.nPSResponse.create({
      data: { score: numScore, comment, dealerId },
    });

    res.status(201).json(nps);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
