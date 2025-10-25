const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all events
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, c.name as category_name, u.name as organizer_name 
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      ORDER BY e.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, c.name as category_name, u.name as organizer_name 
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const { title, description, date, time, location, category_id, organizer_id, max_attendees, image_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO events (title, description, date, time, location, category_id, organizer_id, max_attendees, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, date, time, location, category_id, organizer_id, max_attendees, image_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, location, category_id, max_attendees, status, image_url } = req.body;
    
    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, date = $3, time = $4, location = $5, 
           category_id = $6, max_attendees = $7, status = $8, image_url = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [title, description, date, time, location, category_id, max_attendees, status, image_url, id]
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

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;