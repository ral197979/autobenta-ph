const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /dealers/apply — create or update draft application; submit if submit:true
router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const {
      businessName, businessType, contactName, contactPhone,
      address, city, documents, selectedPlan, submit,
    } = req.body;

    const userId = req.user.id;

    if (submit) {
      // Validate required fields before submitting
      const existing = await prisma.dealerApplication.findUnique({ where: { userId } });
      const merged = {
        businessName: businessName ?? existing?.businessName,
        businessType: businessType ?? existing?.businessType,
        contactName: contactName ?? existing?.contactName,
        contactPhone: contactPhone ?? existing?.contactPhone,
        address: address ?? existing?.address,
        city: city ?? existing?.city,
      };
      const missing = ['businessName', 'businessType', 'contactName', 'contactPhone', 'address', 'city']
        .filter(f => !merged[f]);
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }
    }

    const data = {
      ...(businessName !== undefined && { businessName }),
      ...(businessType !== undefined && { businessType }),
      ...(contactName !== undefined && { contactName }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(documents !== undefined && { documents }),
      ...(selectedPlan !== undefined && { selectedPlan }),
      ...(submit && { status: 'submitted', submittedAt: new Date() }),
    };

    const application = await prisma.dealerApplication.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    res.json(application);
  } catch (err) {
    next(err);
  }
});

// GET /dealers/apply — get current user's application
router.get('/apply', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.dealerApplication.findUnique({
      where: { userId: req.user.id },
    });
    if (!application) return res.status(404).json({ error: 'No application found' });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// PATCH /dealers/apply/step/:step — update individual step without submitting
router.patch('/apply/step/:step', authenticate, async (req, res, next) => {
  try {
    const step = parseInt(req.params.step);
    const userId = req.user.id;
    let data = {};

    if (step === 1) {
      const { businessName, businessType, contactName, contactPhone, address, city } = req.body;
      data = {
        ...(businessName !== undefined && { businessName }),
        ...(businessType !== undefined && { businessType }),
        ...(contactName !== undefined && { contactName }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
      };
    } else if (step === 2) {
      const { documents } = req.body;
      if (documents !== undefined) data.documents = documents;
    } else if (step === 3) {
      const { selectedPlan } = req.body;
      const validPlans = ['free', 'verified', 'pro', 'enterprise'];
      if (selectedPlan && !validPlans.includes(selectedPlan)) {
        return res.status(400).json({ error: `selectedPlan must be one of: ${validPlans.join(', ')}` });
      }
      if (selectedPlan !== undefined) data.selectedPlan = selectedPlan;
    } else {
      return res.status(400).json({ error: 'Step must be 1, 2, or 3' });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for this step' });
    }

    const application = await prisma.dealerApplication.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    res.json(application);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
