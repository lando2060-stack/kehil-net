import { Router } from 'express';
import { ENTITY_MODELS, Announcement } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper: parse sort string '-created_date' → { createdAt: -1 }
const parseSort = (sortStr) => {
  if (!sortStr) return { createdAt: -1 };
  const desc = sortStr.startsWith('-');
  const field = desc ? sortStr.slice(1) : sortStr;
  const mongoField = field.replace(/_date$/, 'At').replace(/_/g, '');
  const map = { updateddate: 'updatedAt', createddate: 'createdAt', order: 'order', updatedAt: 'updatedAt', createdAt: 'createdAt' };
  return { [map[mongoField] || field]: desc ? -1 : 1 };
};

// Helper: public filter for shared items + owner's items
const publicOrOwned = (req, extra = {}) => ({
  $or: [{ created_by: req.user._id }, { is_shared: true }],
  ...extra,
});

// ── GET /api/:entity ──
router.get('/:entity', requireAuth, async (req, res) => {
  try {
    const Model = ENTITY_MODELS[req.params.entity];
    if (!Model) return res.status(404).json({ error: 'Entity not found' });

    const { sort, limit = 100, skip = 0, ...filters } = req.query;
    const sortObj = parseSort(sort);
    const lim = Math.min(parseInt(limit) || 100, 500);

    // Build filter
    let query = {};

    // Announcements: only own unless is_shared filter
    if (req.params.entity === 'announcements') {
      if (filters.is_shared === 'true') {
        query = { is_shared: true };
      } else {
        query = { created_by: req.user._id };
      }
    } else if (['backgrounds', 'templates'].includes(req.params.entity)) {
      query = publicOrOwned(req);
    }

    // Apply extra filters
    Object.entries(filters).forEach(([k, v]) => {
      if (v === 'true') query[k] = true;
      else if (v === 'false') query[k] = false;
      else if (k !== 'is_shared') query[k] = v;
    });

    const docs = await Model.find(query).sort(sortObj).limit(lim).skip(parseInt(skip));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/:entity/:id ──
router.get('/:entity/:id', requireAuth, async (req, res) => {
  try {
    const Model = ENTITY_MODELS[req.params.entity];
    if (!Model) return res.status(404).json({ error: 'Entity not found' });
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    // Access check
    if (doc.created_by && doc.created_by.toString() !== req.user._id.toString() && !doc.is_shared && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/:entity ──
router.post('/:entity', requireAuth, async (req, res) => {
  try {
    const Model = ENTITY_MODELS[req.params.entity];
    if (!Model) return res.status(404).json({ error: 'Entity not found' });

    // Admin-only entities
    if (['template-categories', 'background-categories'].includes(req.params.entity) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    if (req.params.entity === 'users') return res.status(403).json({ error: 'Use /api/auth/register' });

    const doc = await Model.create({ ...req.body, created_by: req.user._id });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PATCH /api/:entity/:id ──
router.patch('/:entity/:id', requireAuth, async (req, res) => {
  try {
    const Model = ENTITY_MODELS[req.params.entity];
    if (!Model) return res.status(404).json({ error: 'Entity not found' });
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // Only owner or admin can update
    if (doc.created_by && doc.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent changing owner
    const { created_by, ...updates } = req.body;
    const updated = await Model.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/:entity/:id ──
router.delete('/:entity/:id', requireAuth, async (req, res) => {
  try {
    const Model = ENTITY_MODELS[req.params.entity];
    if (!Model) return res.status(404).json({ error: 'Entity not found' });
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.created_by && doc.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await doc.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
