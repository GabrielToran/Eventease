const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all registrations for an event
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await pool.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at DESC
    `, [eventId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all registrations for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT r.*, e.title, e.date, e.time, e.location, e.image_url
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY e.date ASC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register for an event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, user_id } = req.body;
    
    // Check if already registered
    const existingReg = await pool.query(
      'SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2',
      [event_id, user_id]
    );
    
    if (existingReg.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }
    
    // Check if event is full
    const eventCheck = await pool.query(`
      SELECT e.max_attendees, COUNT(r.id) as current_attendees
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.id = $1
      GROUP BY e.id, e.max_attendees
    `, [event_id]);
    
    if (eventCheck.rows.length > 0) {
      const { max_attendees, current_attendees } = eventCheck.rows[0];
      if (current_attendees >= max_attendees) {
        return res.status(400).json({ error: 'Event is full' });
      }
    }
    
    // Register user
    const result = await pool.query(
      'INSERT INTO registrations (event_id, user_id) VALUES ($1, $2) RETURNING *',
      [event_id, user_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel registration
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM registrations WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Registration cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;