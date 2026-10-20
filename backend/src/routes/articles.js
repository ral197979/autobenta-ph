const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80);

const listFields = { id: true, slug: true, title: true, category: true, excerpt: true, coverUrl: true, authorName: true, published: true, publishedAt: true, createdAt: true };

// List articles (public = published only; admins can pass ?all=true)
router.get('/', async (req, res, next) => {
  try {
    const { category, q, page = 1, limit = 12 } = req.query;
    const where = { published: true };
    if (category) where.category = { equals: category, mode: 'insensitive' };
    if (q) where.title = { contains: q, mode: 'insensitive' };
    const take = Math.min(parseInt(limit) || 12, 50);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;
    const [articles, total] = await Promise.all([
      prisma.article.findMany({ where, select: listFields, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }], take, skip }),
      prisma.article.count({ where }),
    ]);
    res.json({ articles, pagination: { total, page: parseInt(page) || 1, pages: Math.ceil(total / take) } });
  } catch (e) { next(e); }
});

// Admin: list all (incl. drafts)
router.get('/admin/all', authenticate, requireRole('admin'), async (_req, res, next) => {
  try {
    const articles = await prisma.article.findMany({ select: listFields, orderBy: { updatedAt: 'desc' } });
    res.json(articles);
  } catch (e) { next(e); }
});

// Single article by slug (published, or any for admin)
router.get('/:slug', async (req, res, next) => {
  try {
    const a = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!a || (!a.published && req.query.preview !== 'true')) return res.status(404).json({ error: 'Article not found' });
    res.json(a);
  } catch (e) { next(e); }
});

// Create (admin)
router.post('/', authenticate, requireRole('admin'), [body('title').trim().notEmpty(), body('body').trim().notEmpty()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, category, excerpt, body: content, coverUrl, authorName, published } = req.body;
    let slug = slugify(title);
    if (await prisma.article.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const article = await prisma.article.create({
      data: {
        slug, title, category: category || 'News', excerpt: excerpt || null, body: content,
        coverUrl: coverUrl || null, authorName: authorName || null,
        published: !!published, publishedAt: published ? new Date() : null,
      },
    });
    res.status(201).json(article);
  } catch (e) { next(e); }
});

// Update (admin)
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Article not found' });
    const data = {};
    for (const k of ['title', 'category', 'excerpt', 'body', 'coverUrl', 'authorName']) if (req.body[k] !== undefined) data[k] = req.body[k];
    if (req.body.published !== undefined) {
      data.published = !!req.body.published;
      if (req.body.published && !existing.publishedAt) data.publishedAt = new Date();
    }
    const updated = await prisma.article.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (e) { next(e); }
});

// Delete (admin)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
