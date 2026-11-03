const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/users — list all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(
    'SELECT id, email, role, active, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

// POST /api/users — create user (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  if (!['admin', 'marketer'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or marketer' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), password_hash, role);

    const user = db.prepare('SELECT id, email, role, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id — toggle active status (admin only)
router.patch('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent admin from deactivating themselves
  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }

  const newActive = user.active ? 0 : 1;
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(newActive, id);

  const updated = db.prepare('SELECT id, email, role, active, created_at FROM users WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;
