const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/reports — admin gets all, marketer gets own
router.get('/', requireAuth, (req, res) => {
  let reports;
  if (req.user.role === 'admin') {
    reports = db.prepare(`
      SELECT r.*, u.email as creator_email
      FROM reports r
      JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
    `).all();
  } else {
    reports = db.prepare(`
      SELECT r.*, u.email as creator_email
      FROM reports r
      JOIN users u ON r.created_by = u.id
      WHERE r.created_by = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
  }
  res.json(reports);
});

// POST /api/reports — create report (any authenticated user)
router.post('/', requireAuth, (req, res) => {
  const { title, campaign_name, channel, spend, impressions, clicks, conversions, notes } = req.body;

  if (!title || !campaign_name || !channel) {
    return res.status(400).json({ error: 'Title, campaign name, and channel are required' });
  }

  const validChannels = ['Social Media', 'Email', 'SEO', 'PPC', 'Events', 'Other'];
  if (!validChannels.includes(channel)) {
    return res.status(400).json({ error: 'Invalid channel' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO reports (title, campaign_name, channel, spend, impressions, clicks, conversions, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      campaign_name,
      channel,
      parseFloat(spend) || 0,
      parseInt(impressions) || 0,
      parseInt(clicks) || 0,
      parseInt(conversions) || 0,
      notes || null,
      req.user.id
    );

    const report = db.prepare(`
      SELECT r.*, u.email as creator_email
      FROM reports r
      JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/reports/:id — get single report
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  const report = db.prepare(`
    SELECT r.*, u.email as creator_email
    FROM reports r
    JOIN users u ON r.created_by = u.id
    WHERE r.id = ?
  `).get(id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Marketers can only view their own reports
  if (req.user.role !== 'admin' && report.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Calculated metrics
  const ctr = report.impressions > 0
    ? ((report.clicks / report.impressions) * 100).toFixed(2)
    : '0.00';
  const roi = report.spend > 0
    ? (((report.conversions * 50 - report.spend) / report.spend) * 100).toFixed(2)
    : '0.00';
  const conversionRate = report.clicks > 0
    ? ((report.conversions / report.clicks) * 100).toFixed(2)
    : '0.00';

  res.json({ ...report, ctr, roi, conversionRate });
});

module.exports = router;
