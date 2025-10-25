const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Get dashboard statistics
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    
    // Get total events
    const eventsResult = await pool.query('SELECT COUNT(*) as total FROM events');
    
    // Get total registrations
    const registrationsResult = await pool.query('SELECT COUNT(*) as total FROM registrations');
    
    // Get upcoming events
    const upcomingResult = await pool.query(
      "SELECT COUNT(*) as total FROM events WHERE date >= CURRENT_DATE AND status = 'active'"
    );
    
    res.json({
      totalUsers: parseInt(usersResult.rows[0].total),
      totalEvents: parseInt(eventsResult.rows[0].total),
      totalRegistrations: parseInt(registrationsResult.rows[0].total),
      upcomingEvents: parseInt(upcomingResult.rows[0].total)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent activities
router.get('/activities', authenticateToken, isAdmin, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const result = await pool.query(`
      SELECT 
        'registration' as type,
        r.id,
        r.registered_at as created_at,
        u.name as user_name,
        e.title as event_title
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      UNION ALL
      SELECT 
        'event' as type,
        e.id,
        e.created_at,
        u.name as user_name,
        e.title as event_title
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'organizer', 'attendee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event status
router.put('/events/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE events SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;