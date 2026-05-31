const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

const TRIGGER_ACTIONS = {
  missed_invoice: 'Resolve overdue invoice immediately — call dealer today',
  no_lead_response_48h: 'Coach dealer on lead response — set up response reminders',
  no_login_7d: 'Re-engagement call — check if dealer is still active',
  no_inventory_update: 'Assist dealer with inventory upload',
  low_crm_usage: 'Schedule CRM training session',
};

// POST /admin/churn-risk/scan
router.post('/admin/churn-risk/scan', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const day14 = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const h48 = new Date(now - 48 * 60 * 60 * 1000);

    const dealers = await prisma.dealer.findMany({
      include: {
        leads: true,
        listings: true,
      },
    });

    const created = [];
    for (const dealer of dealers) {
      const triggers = [];
      let riskScore = 0;

      // no_login_7d
      if (dealer.updatedAt < day7) {
        triggers.push('no_login_7d');
        riskScore += 25;
      }

      // no_lead_response_48h
      const staleLead = dealer.leads.some(l => l.status === 'new' && l.createdAt < h48);
      if (staleLead) { triggers.push('no_lead_response_48h'); riskScore += 30; }

      // no_inventory_update
      const hasRecentListing = dealer.listings.some(l => l.updatedAt >= day14);
      if (dealer.listings.length > 0 && !hasRecentListing) {
        triggers.push('no_inventory_update');
        riskScore += 20;
      }

      // low_crm_usage
      if (dealer.leads.length > 0) {
        const leadsWithActivity = await prisma.lead.count({ where: { dealerId: dealer.id, activities: { some: {} } } });
        if (leadsWithActivity / dealer.leads.length < 0.2) {
          triggers.push('low_crm_usage');
          riskScore += 15;
        }
      }

      // missed_invoice
      const overdueInvoice = await prisma.closingInvoice.count({ where: { dealerId: dealer.id, status: 'overdue' } });
      if (overdueInvoice > 0) { triggers.push('missed_invoice'); riskScore += 40; }

      if (riskScore === 0) continue;

      // Skip if open record already exists
      const existing = await prisma.churnRisk.findFirst({ where: { dealerId: dealer.id, status: 'open' } });
      if (existing) continue;

      const topTrigger = triggers.sort((a, b) => {
        const w = { missed_invoice: 40, no_lead_response_48h: 30, no_login_7d: 25, no_inventory_update: 20, low_crm_usage: 15 };
        return (w[b] || 0) - (w[a] || 0);
      })[0];

      const record = await prisma.churnRisk.create({
        data: { dealerId: dealer.id, riskScore, triggers, recommendedAction: TRIGGER_ACTIONS[topTrigger] || null },
      });
      created.push(record);
    }

    res.json({ scanned: dealers.length, created: created.length, records: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/churn-risk/summary
router.get('/admin/churn-risk/summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const risks = await prisma.churnRisk.findMany({ where: { status: 'open' } });
    const totalAtRisk = risks.length;
    const avgRiskScore = totalAtRisk ? Math.round(risks.reduce((s, r) => s + r.riskScore, 0) / totalAtRisk) : 0;

    const triggerCount = {};
    for (const r of risks) {
      for (const t of (r.triggers || [])) {
        triggerCount[t] = (triggerCount[t] || 0) + 1;
      }
    }
    const byTrigger = Object.entries(triggerCount).map(([trigger, count]) => ({ trigger, count }));

    res.json({ totalAtRisk, avgRiskScore, byTrigger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/churn-risk
router.get('/admin/churn-risk', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const risks = await prisma.churnRisk.findMany({
      where: { status: 'open' },
      include: { dealer: { select: { id: true, businessName: true } } },
      orderBy: { riskScore: 'desc' },
    });
    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/churn-risk/:id
router.patch('/admin/churn-risk/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const data = { ...req.body };
    if (status === 'resolved') data.resolvedAt = new Date();
    const risk = await prisma.churnRisk.update({ where: { id: req.params.id }, data });
    res.json(risk);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Churn risk not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
