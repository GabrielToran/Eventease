const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Submit feedback for an event (Attendees only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, user_id, rating, comment } = req.body;
    
    // Verify the user is registered for this event
    const registration = await pool.query(
      'SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2',
      [event_id, user_id]
    );
    
    if (registration.rows.length === 0) {
      return res.status(403).json({ error: 'You must be registered for this event to leave feedback' });
    }
    
    // Check if user already submitted feedback
    const existingFeedback = await pool.query(
      'SELECT * FROM feedback WHERE event_id = $1 AND user_id = $2',
      [event_id, user_id]
    );
    
    if (existingFeedback.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted feedback for this event' });
    }
    
    // Insert feedback
    const result = await pool.query(
      'INSERT INTO feedback (event_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [event_id, user_id, rating, comment]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get feedback for a specific event (Organizers/Admins)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if user is the organizer or admin
    const event = await pool.query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    
    if (event.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.rows[0].organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(`
      SELECT f.*, u.name as user_name, e.title as event_title
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      JOIN events e ON f.event_id = e.id
      WHERE f.event_id = $1
      ORDER BY f.created_at DESC
    `, [eventId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all feedback for organizer's events
router.get('/organizer/:organizerId', authenticateToken, async (req, res) => {
  try {
    const { organizerId } = req.params;
    
    // Check if user is the organizer or admin
    if (parseInt(organizerId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(`
      SELECT f.*, u.name as user_name, e.title as event_title, e.id as event_id
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      JOIN events e ON f.event_id = e.id
      WHERE e.organizer_id = $1
      ORDER BY f.created_at DESC
    `, [organizerId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user can provide feedback for an event
router.get('/can-feedback/:eventId/:userId', authenticateToken, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    // Check if registered
    const registration = await pool.query(
      'SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    
    if (registration.rows.length === 0) {
      return res.json({ canFeedback: false, reason: 'Not registered' });
    }
    
    // Check if event has passed
    const event = await pool.query(
      'SELECT date FROM events WHERE id = $1',
      [eventId]
    );
    
    if (event.rows.length === 0) {
      return res.json({ canFeedback: false, reason: 'Event not found' });
    }
    
    const eventDate = new Date(event.rows[0].date);
    const today = new Date();
    
    if (eventDate >= today) {
      return res.json({ canFeedback: false, reason: 'Event has not occurred yet' });
    }
    
    // Check if already submitted
    const existingFeedback = await pool.query(
      'SELECT * FROM feedback WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    
    if (existingFeedback.rows.length > 0) {
      return res.json({ canFeedback: false, reason: 'Already submitted' });
    }
    
    res.json({ canFeedback: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;