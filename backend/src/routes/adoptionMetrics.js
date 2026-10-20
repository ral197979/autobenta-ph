const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


function isoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return { weekNumber: 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7), year: d.getFullYear() };
}

// POST /admin/adoption/snapshot/:dealerId
router.post('/admin/adoption/snapshot/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { logins, listingsAdded, leadsUpdated, crmNotesAdded, pipelineMovements, analyticsViews } = req.body;
    const { weekNumber, year } = isoWeek(new Date());

    const data = {
      ...(logins !== undefined && { logins }),
      ...(listingsAdded !== undefined && { listingsAdded }),
      ...(leadsUpdated !== undefined && { leadsUpdated }),
      ...(crmNotesAdded !== undefined && { crmNotesAdded }),
      ...(pipelineMovements !== undefined && { pipelineMovements }),
      ...(analyticsViews !== undefined && { analyticsViews }),
    };

    let lowAdoptionAlert = false;
    let alertReason = null;
    if (logins === 0) { lowAdoptionAlert = true; alertReason = 'No logins this week'; }

    const snapshot = await prisma.adoptionSnapshot.upsert({
      where: { dealerId_weekNumber_year: { dealerId, weekNumber, year } },
      update: { ...data, lowAdoptionAlert, alertReason },
      create: { dealerId, weekNumber, year, ...data, lowAdoptionAlert, alertReason },
    });
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/adoption/:dealerId
router.get('/admin/adoption/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const snapshots = await prisma.adoptionSnapshot.findMany({
      where: { dealerId: req.params.dealerId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/adoption/:dealerId/alerts
router.get('/admin/adoption/:dealerId/alerts', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const snapshots = await prisma.adoptionSnapshot.findMany({
      where: { dealerId: req.params.dealerId, lowAdoptionAlert: true },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
