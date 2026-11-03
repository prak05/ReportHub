const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/budget — all authenticated users
router.get('/', requireAuth, (req, res) => {
  const budgets = db.prepare(`
    SELECT b.*, u.email as creator_email
    FROM budgets b
    JOIN users u ON b.created_by = u.id
    ORDER BY b.created_at DESC
  `).all();

  // Total spend from reports
  const spendRow = db.prepare('SELECT COALESCE(SUM(spend), 0) as total_spend FROM reports').get();
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);

  res.json({
    budgets,
    summary: {
      totalAllocated,
      totalSpend: spendRow.total_spend
    }
  });
});

// POST /api/budget — admin only
router.post('/', requireAdmin, (req, res) => {
  const { department, campaign, allocated_amount, fiscal_period } = req.body;

  if (!department || !campaign || !fiscal_period) {
    return res.status(400).json({ error: 'Department, campaign, and fiscal period are required' });
  }

  if (allocated_amount === undefined || allocated_amount === null || isNaN(parseFloat(allocated_amount))) {
    return res.status(400).json({ error: 'Valid allocated amount is required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO budgets (department, campaign, allocated_amount, fiscal_period, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      department,
      campaign,
      parseFloat(allocated_amount),
      fiscal_period,
      req.user.id
    );

    const budget = db.prepare(`
      SELECT b.*, u.email as creator_email
      FROM budgets b
      JOIN users u ON b.created_by = u.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create budget entry' });
  }
});

// PUT /api/budget/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { department, campaign, allocated_amount, fiscal_period } = req.body;

  const existing = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Budget entry not found' });
  }

  if (!department || !campaign || !fiscal_period) {
    return res.status(400).json({ error: 'Department, campaign, and fiscal period are required' });
  }

  if (allocated_amount === undefined || isNaN(parseFloat(allocated_amount))) {
    return res.status(400).json({ error: 'Valid allocated amount is required' });
  }

  db.prepare(`
    UPDATE budgets
    SET department = ?, campaign = ?, allocated_amount = ?, fiscal_period = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(department, campaign, parseFloat(allocated_amount), fiscal_period, id);

  const updated = db.prepare(`
    SELECT b.*, u.email as creator_email
    FROM budgets b
    JOIN users u ON b.created_by = u.id
    WHERE b.id = ?
  `).get(id);

  res.json(updated);
});

// DELETE /api/budget/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Budget entry not found' });
  }

  db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
  res.json({ message: 'Budget entry deleted successfully' });
});

module.exports = router;
