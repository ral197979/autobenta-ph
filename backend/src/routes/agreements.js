const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');


const VALID_TRANSITIONS = {
  generated: 'sent',
  sent: 'viewed',
  viewed: 'signed',
  signed: 'stored',
};

// POST /admin/agreements
router.post('/admin/agreements', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { proposalId, version } = req.body;
    if (!proposalId) return res.status(400).json({ error: 'proposalId is required' });
    const agreement = await prisma.agreement.create({
      data: { proposalId, version: version || '1.0', status: 'generated' },
    });
    res.status(201).json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/agreements
router.get('/admin/agreements', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const agreements = await prisma.agreement.findMany({
      include: { proposal: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/agreements/:id
router.get('/admin/agreements/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: { proposal: true, invoice: true },
    });
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });
    res.json(agreement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/agreements/:id
router.patch('/admin/agreements/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, actor, signerName, signerEmail, signerTitle, ...rest } = req.body;
    const current = await prisma.agreement.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Agreement not found' });

    const data = { ...rest };

    if (status) {
      if (VALID_TRANSITIONS[current.status] !== status) {
        return res.status(400).json({ error: `Invalid transition: ${current.status} → ${status}` });
      }
      if (status === 'signed') {
        if (!signerName || !signerEmail) {
          return res.status(400).json({ error: 'signerName and signerEmail required when signing' });
        }
        data.signerName = signerName;
        data.signerEmail = signerEmail;
        if (signerTitle) data.signerTitle = signerTitle;
        data.signedAt = new Date();
      }
      if (status === 'sent') data.sentAt = new Date();
      if (status === 'viewed') data.viewedAt = new Date();
      data.status = status;

      const auditEntry = { action: status, timestamp: new Date().toISOString(), actor: actor || null };
      data.auditLog = [...(current.auditLog || []), auditEntry];
    }

    const agreement = await prisma.agreement.update({ where: { id: req.params.id }, data });
    res.json(agreement);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Agreement not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
