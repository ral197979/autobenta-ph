const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Dealer routes ────────────────────────────────────────────────────────────

// GET /dealer/credits — dealer's credit balance + recent 10 transactions
router.get('/dealer/credits', authenticate, requireRole('dealer', 'admin'), async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.findFirst({ where: { userId: req.user.id } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const credit = await prisma.leadCredit.findUnique({
      where: { dealerId: dealer.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!credit) {
      return res.json({ balance: 0, lifetimeCredits: 0, transactions: [] });
    }

    res.json({
      balance: credit.balance,
      lifetimeCredits: credit.lifetimeCredits,
      transactions: credit.transactions,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

// POST /admin/credits/packages — create a credit package
router.post('/admin/credits/packages', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, credits, pricePhp } = req.body;
    if (!name || credits == null || pricePhp == null) {
      return res.status(400).json({ error: 'name, credits, and pricePhp are required' });
    }
    const pkg = await prisma.creditPackage.create({
      data: { name, credits: parseInt(credits), pricePhp: parseFloat(pricePhp) },
    });
    res.status(201).json(pkg);
  } catch (err) {
    next(err);
  }
});

// GET /admin/credits/packages — list active packages
router.get('/admin/credits/packages', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { credits: 'asc' },
    });
    res.json(packages);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/credits/packages/:id — update package
router.patch('/admin/credits/packages/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const pkg = await prisma.creditPackage.findUnique({ where: { id: req.params.id } });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const { isActive, pricePhp, credits } = req.body;
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (pricePhp !== undefined) updateData.pricePhp = parseFloat(pricePhp);
    if (credits !== undefined) updateData.credits = parseInt(credits);

    const updated = await prisma.creditPackage.update({ where: { id: req.params.id }, data: updateData });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /admin/credits/award/:dealerId — manually award credits
router.post('/admin/credits/award/:dealerId', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { dealerId } = req.params;
    const { credits, description } = req.body;

    if (!credits || parseInt(credits) <= 0) {
      return res.status(400).json({ error: 'credits must be a positive integer' });
    }

    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const creditAmount = parseInt(credits);

    // Atomic: upsert credit balance + create transaction record together
    const existingCredit = await prisma.leadCredit.findUnique({ where: { dealerId } });
    const balanceBefore = existingCredit?.balance || 0;
    const balanceAfter = balanceBefore + creditAmount;

    const [leadCredit, transaction] = await prisma.$transaction(async (tx) => {
      const lc = await tx.leadCredit.upsert({
        where: { dealerId },
        update: {
          balance: { increment: creditAmount },
          lifetimeCredits: { increment: creditAmount },
        },
        create: {
          dealerId,
          balance: creditAmount,
          lifetimeCredits: creditAmount,
        },
      });
      const t = await tx.creditTransaction.create({
        data: {
          dealerId,
          creditId: lc.id,
          type: 'bonus',
          credits: creditAmount,
          balanceBefore,
          balanceAfter,
          description: description || `Manual award of ${creditAmount} credits`,
        },
      });
      return [lc, t];
    });

    res.status(201).json({ leadCredit, transaction });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
