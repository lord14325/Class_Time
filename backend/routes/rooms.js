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
    const { room_number, room_name, capacity, room_type } = req.body;

    const result = await pool.query(`
      INSERT INTO rooms (room_number, room_name, capacity, room_type, is_available)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [room_number, room_name, capacity, room_type]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, room_name, capacity, room_type } = req.body;

    const result = await pool.query(`
      UPDATE rooms
      SET room_number = $1, room_name = $2, capacity = $3, room_type = $4
      WHERE id = $5
      RETURNING *
    `, [room_number, room_name, capacity, room_type, id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roomExists = await pool.query('SELECT id FROM rooms WHERE id = $1', [id]);
    if (roomExists.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if students are assigned to this room
    const studentsInRoom = await pool.query('SELECT COUNT(*) as count FROM students WHERE room_id = $1', [id]);
    const studentCount = parseInt(studentsInRoom.rows[0].count);

    // Check if there are class sections in this room
    const classSectionsInRoom = await pool.query('SELECT COUNT(*) as count FROM class_sections WHERE room_id = $1', [id]);
    const classSectionCount = parseInt(classSectionsInRoom.rows[0].count);

    // Check if there are schedules in this room
    const schedulesInRoom = await pool.query(`
      SELECT COUNT(*) as count FROM daily_schedules
      WHERE room_id = $1 OR class_section_id IN (
        SELECT id FROM class_sections WHERE room_id = $1
      )
    `, [id]);
    const scheduleCount = parseInt(schedulesInRoom.rows[0].count);

    if (studentCount > 0 || classSectionCount > 0 || scheduleCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete room',
        studentCount,
        classSectionCount,
        scheduleCount
      });
    }

    // Delete the room if no dependencies exist
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