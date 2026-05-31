const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

const TASK_SCHEDULE = [
  { dayNumber: 1,  taskType: 'check_in',     title: 'Day 1 Welcome Check-in',        description: 'Call dealer to confirm login, answer first questions, confirm inventory import started' },
  { dayNumber: 3,  taskType: 'training',      title: 'Day 3 CRM Training',            description: 'Walk through lead management, show how to move cards, add notes, set reminders' },
  { dayNumber: 7,  taskType: 'check_in',      title: 'Week 1 Review',                 description: 'Review listings quality, check for first leads, celebrate any wins' },
  { dayNumber: 14, taskType: 'optimization',  title: 'Week 2 Optimization',           description: 'Review lead response times, suggest listing improvements, check CRM adoption' },
  { dayNumber: 30, taskType: 'check_in',      title: 'Month 1 Success Review',        description: 'Full metrics review, ROI calculation, address concerns, start renewal conversation' },
  { dayNumber: 60, taskType: 'optimization',  title: 'Month 2 Deep Optimization',     description: 'Advanced CRM features, analytics review, identify expansion opportunities' },
  { dayNumber: 90, taskType: 'renewal_prep',  title: 'Month 3 Renewal Preparation',   description: 'Renewal proposal, case study interview, expansion upsell, confirm renewal' },
];

// POST /admin/cs-tasks/generate/:dealerId
router.post('/admin/cs-tasks/generate/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { dealerId } = req.params;
    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    const existing = await prisma.customerSuccessTask.findMany({ where: { dealerId }, select: { dayNumber: true } });
    const existingDays = new Set(existing.map(t => t.dayNumber));

    const signupDate = new Date(dealer.createdAt);
    const toCreate = TASK_SCHEDULE
      .filter(t => !existingDays.has(t.dayNumber))
      .map(t => ({
        dealerId,
        ...t,
        dueDate: new Date(signupDate.getTime() + t.dayNumber * 86400000),
      }));

    if (toCreate.length === 0) return res.json({ created: 0, tasks: [] });

    await prisma.customerSuccessTask.createMany({ data: toCreate });
    const tasks = await prisma.customerSuccessTask.findMany({ where: { dealerId }, orderBy: { dayNumber: 'asc' } });
    res.json({ created: toCreate.length, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/cs-tasks/overdue
router.get('/admin/cs-tasks/overdue', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const tasks = await prisma.customerSuccessTask.findMany({
      where: { status: 'pending', dueDate: { lt: new Date() } },
      include: { dealer: { select: { id: true, businessName: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/cs-tasks/:dealerId
router.get('/admin/cs-tasks/:dealerId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const tasks = await prisma.customerSuccessTask.findMany({
      where: { dealerId: req.params.dealerId },
      orderBy: { dayNumber: 'asc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/cs-tasks/:id
router.patch('/admin/cs-tasks/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (status === 'done') data.completedAt = new Date();
    const task = await prisma.customerSuccessTask.update({ where: { id: req.params.id }, data });
    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Task not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
