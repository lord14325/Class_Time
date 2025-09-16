const express = require("express");
const router = express.Router();
const pool = require("../db");


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        room_number,
        room_name,
        capacity,
        room_type,
        is_available,
        created_at
      FROM rooms 
      ORDER BY room_number ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rooms',
      message: error.message 
    });
  }
});


router.post('/', async (req, res) => {
  try {
    const { 
      room_number, 
      room_name, 
      capacity, 
      room_type, 
      is_available 
    } = req.body;

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({ error: 'Room number is required' });
    }

    if (!capacity || capacity < 1) {
      return res.status(400).json({ error: 'Valid capacity is required' });
    }

    if (!room_type || !room_type.trim()) {
      return res.status(400).json({ error: 'Room type is required' });
    }

    const existingRoom = await pool.query(
      'SELECT id FROM rooms WHERE room_number = $1',
      [room_number.trim()]
    );

    if (existingRoom.rows.length > 0) {
      return res.status(400).json({ error: 'Room number already exists' });
    }

    const result = await pool.query(`
      INSERT INTO rooms (room_number, room_name, capacity, room_type, is_available)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, room_number, room_name, capacity, room_type, is_available, created_at
    `, [
      room_number.trim(),
      room_name ? room_name.trim() : null,
      parseInt(capacity),
      room_type.trim(),
      is_available !== undefined ? is_available : true
    ]);

    res.status(201).json({
      message: 'Room created successfully',
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating room:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Room number already exists' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create room',
      message: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      room_number, 
      room_name, 
      capacity, 
      room_type, 
      is_available 
    } = req.body;

    if (!room_number || !room_number.trim()) {
      return res.status(400).json({ error: 'Room number is required' });
    }

    if (!capacity || capacity < 1) {
      return res.status(400).json({ error: 'Valid capacity is required' });
    }

    if (!room_type || !room_type.trim()) {
      return res.status(400).json({ error: 'Room type is required' });
    }

    const roomExists = await pool.query('SELECT id FROM rooms WHERE id = $1', [id]);
    if (roomExists.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const existingRoom = await pool.query(
      'SELECT id FROM rooms WHERE room_number = $1 AND id != $2',
      [room_number.trim(), id]
    );

    if (existingRoom.rows.length > 0) {
      return res.status(400).json({ error: 'Room number already exists' });
    }

    const result = await pool.query(`
      UPDATE rooms 
      SET 
        room_number = $1,
        room_name = $2,
        capacity = $3,
        room_type = $4,
        is_available = $5
      WHERE id = $6
      RETURNING id, room_number, room_name, capacity, room_type, is_available, created_at
    `, [
      room_number.trim(),
      room_name ? room_name.trim() : null,
      parseInt(capacity),
      room_type.trim(),
      is_available !== undefined ? is_available : true,
      id
    ]);

    res.json({
      message: 'Room updated successfully',
      room: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating room:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Room number already exists' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update room',
      message: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roomExists = await pool.query('SELECT id FROM rooms WHERE id = $1', [id]);
    if (roomExists.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      error: 'Failed to delete room',
      message: error.message
    });
  }
});


module.exports = router;