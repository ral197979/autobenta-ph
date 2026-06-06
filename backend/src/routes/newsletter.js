const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Subscribe an email to the newsletter (idempotent).
router.post('/', [body('email').isEmail().normalizeEmail()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'A valid email is required' });
  try {
    const { email } = req.body;
    await prisma.subscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
