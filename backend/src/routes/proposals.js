const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

function calcRoi(proposal) {
  const monthlyLeadsEstimate = Math.round((proposal.monthlyVehicles || 10) * 0.3);
  const monthlyRevenueUplift = monthlyLeadsEstimate * (proposal.avgGrossProfit || 50000) * 0.15;
  const netMonthly = (proposal.pricingMonthly || 3599) - (proposal.discount || 0);
  const annualRoi = Math.round(((monthlyRevenueUplift * 12) / (netMonthly * 12)) * 100);
  const paybackMonths = Math.ceil(netMonthly / (monthlyRevenueUplift || 1));
  return { monthlyLeadsEstimate, monthlyRevenueUplift, annualRoi, paybackMonths };
}

// POST /admin/proposals
router.post('/admin/proposals', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { dealerProspectId, dealerName, contactName, location, currentProcess,
      painPoints, monthlyVehicles, avgGrossProfit, pricingMonthly, discount, notes } = req.body;

    if (!dealerProspectId || !dealerName || !contactName) {
      return res.status(400).json({ error: 'dealerProspectId, dealerName, contactName are required' });
    }

    const roiEstimate = calcRoi({ monthlyVehicles, avgGrossProfit, pricingMonthly: pricingMonthly || 3599, discount: discount || 0 });

    const proposal = await prisma.proposal.create({
      data: { dealerProspectId, dealerName, contactName, location, currentProcess,
        painPoints, monthlyVehicles, avgGrossProfit, pricingMonthly: pricingMonthly || 3599,
        discount: discount || 0, notes, roiEstimate },
    });
    res.status(201).json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/proposals
router.get('/admin/proposals', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      include: { dealerProspect: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/proposals/:id
router.get('/admin/proposals/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { dealerProspect: true, agreement: true },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/proposals/:id
router.patch('/admin/proposals/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, ...rest } = req.body;
    const data = { ...rest };
    if (status) {
      data.status = status;
      if (status === 'sent' && !rest.sentAt) data.sentAt = new Date();
      if (status === 'viewed' && !rest.viewedAt) data.viewedAt = new Date();
      if (status === 'accepted' && !rest.acceptedAt) data.acceptedAt = new Date();
    }
    if (data.monthlyVehicles !== undefined || data.avgGrossProfit !== undefined ||
        data.pricingMonthly !== undefined || data.discount !== undefined) {
      const current = await prisma.proposal.findUnique({ where: { id: req.params.id } });
      data.roiEstimate = calcRoi({ ...current, ...data });
    }
    const proposal = await prisma.proposal.update({ where: { id: req.params.id }, data });
    res.json(proposal);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Proposal not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/proposals/:id — soft delete if no signed agreement
router.delete('/admin/proposals/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { agreement: true },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.agreement?.status === 'signed') {
      return res.status(409).json({ error: 'Cannot cancel proposal with a signed agreement' });
    }
    await prisma.proposal.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
