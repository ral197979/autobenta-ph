const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


// POST /admin/invoices
router.post('/admin/invoices', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { agreementId, dealerId, dealerName, dealerEmail, billingPeriod, amount, discount, dueDate, notes } = req.body;
    if (!dealerName || !dealerEmail || !billingPeriod || amount === undefined) {
      return res.status(400).json({ error: 'dealerName, dealerEmail, billingPeriod, amount are required' });
    }
    const invoiceNumber = `INV-${dealerName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const disc = discount || 0;
    const totalAmount = amount - disc;

    const invoice = await prisma.closingInvoice.create({
      data: { agreementId, dealerId, dealerName, dealerEmail, billingPeriod,
        amount, discount: disc, totalAmount, dueDate: dueDate ? new Date(dueDate) : null,
        notes, invoiceNumber, status: 'draft' },
    });
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/invoices
router.get('/admin/invoices', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const invoices = await prisma.closingInvoice.findMany({
      include: { dealer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/invoices/:id
router.get('/admin/invoices/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const invoice = await prisma.closingInvoice.findUnique({
      where: { id: req.params.id },
      include: { dealer: true, agreement: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/invoices/:id
router.patch('/admin/invoices/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, ...rest } = req.body;
    const data = { ...rest };
    if (status) {
      data.status = status;
      if (status === 'sent') data.issuedAt = new Date();
      if (status === 'paid') data.paidAt = new Date();
      if (status === 'overdue') {
        const current = await prisma.closingInvoice.findUnique({ where: { id: req.params.id } });
        if (!current) return res.status(404).json({ error: 'Invoice not found' });
        if (current.dueDate && current.dueDate < new Date()) data.status = 'overdue';
      }
    }
    const invoice = await prisma.closingInvoice.update({ where: { id: req.params.id }, data });
    res.json(invoice);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Invoice not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/invoices/:id — only if draft
router.delete('/admin/invoices/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const invoice = await prisma.closingInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'draft') return res.status(409).json({ error: 'Only draft invoices can be deleted' });
    await prisma.closingInvoice.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
