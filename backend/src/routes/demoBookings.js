const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


// POST /book-demo — PUBLIC
router.post('/book-demo', async (req, res, next) => {
  try {
    const {
      name, company, email, phone, inventoryCount, currentProcess,
      challenges, demoType, scheduledAt,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!company) return res.status(400).json({ error: 'company is required' });
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' });

    const booking = await prisma.demoBooking.create({
      data: {
        name,
        company,
        email,
        phone,
        inventoryCount,
        currentProcess,
        challenges,
        demoType: demoType || 'full_platform',
        scheduledAt: new Date(scheduledAt),
      },
    });

    // Try to link to existing prospect by email
    if (email) {
      const existingProspect = await prisma.dealerProspect.findFirst({
        where: { email },
      });

      if (existingProspect) {
        await prisma.$transaction([
          prisma.demoBooking.update({
            where: { id: booking.id },
            data: { prospectId: existingProspect.id },
          }),
          prisma.prospectActivity.create({
            data: {
              prospectId: existingProspect.id,
              type: 'demo_scheduled',
              content: `Demo booked for ${new Date(scheduledAt).toISOString()} (booking ${booking.id})`,
            },
          }),
        ]);
      } else {
        // Create new prospect
        const prospect = await prisma.dealerProspect.create({
          data: {
            dealerName: company,
            contactName: name,
            email,
            phone,
            stage: 'demo_scheduled',
            source: 'demo_booking',
            activities: {
              create: {
                type: 'demo_scheduled',
                content: `Demo booked for ${new Date(scheduledAt).toISOString()} (booking ${booking.id})`,
              },
            },
          },
        });
        await prisma.demoBooking.update({
          where: { id: booking.id },
          data: { prospectId: prospect.id },
        });
      }
    }

    const updatedBooking = await prisma.demoBooking.findUnique({
      where: { id: booking.id },
      include: { prospect: true },
    });

    res.status(201).json(updatedBooking);
  } catch (err) {
    next(err);
  }
});

// GET /admin/demos — admin only
router.get('/admin/demos', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const bookings = await prisma.demoBooking.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: { prospect: true },
    });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/demos/:id — admin only
router.patch('/admin/demos/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const exists = await prisma.demoBooking.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: 'Not found' });

    const { status, notes } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const booking = await prisma.demoBooking.update({
      where: { id: req.params.id },
      data: updates,
      include: { prospect: true },
    });

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
