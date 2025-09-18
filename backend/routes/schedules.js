const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all schedules with full details
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.is_active,
        s.created_at,
        cs.section_name,
        cs.semester,
        cs.academic_year,
        cs.max_students,
        c.course_code,
        c.course_name,
        c.department,
        u.name AS teacher_name,
        t.employee_id,
        r.room_number,
        r.room_name,
        r.capacity
      FROM schedules s
      JOIN class_sections cs ON s.class_section_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.is_active = true AND cs.is_active = true
      ORDER BY s.day_of_week, s.start_time ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get schedules error:", error.message);
    res.status(500).json({ message: "Server error fetching schedules" });
  }
});

// GET schedules by filters
router.get("/filter", async (req, res) => {
  try {
    const { semester, academic_year, grade_level, section_name, day_of_week } = req.query;

    let query = `
      SELECT
        s.id,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.is_active,
        s.created_at,
        cs.section_name,
        cs.semester,
        cs.academic_year,
        cs.max_students,
        c.course_code,
        c.course_name,
        c.department,
        u.name AS teacher_name,
        t.employee_id,
        r.room_number,
        r.room_name,
        r.capacity
      FROM schedules s
      JOIN class_sections cs ON s.class_section_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.is_active = true AND cs.is_active = true
    `;

    const params = [];
    let paramCount = 0;

    if (semester) {
      paramCount++;
      query += ` AND cs.semester = $${paramCount}`;
      params.push(semester);
    }

    if (academic_year) {
      paramCount++;
      query += ` AND cs.academic_year = $${paramCount}`;
      params.push(academic_year);
    }


    if (section_name) {
      paramCount++;
      query += ` AND cs.section_name = $${paramCount}`;
      params.push(section_name);
    }

    if (day_of_week) {
      paramCount++;
      query += ` AND s.day_of_week = $${paramCount}`;
      params.push(day_of_week);
    }

    query += ` ORDER BY s.day_of_week, s.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Filter schedules error:", error.message);
    res.status(500).json({ message: "Server error filtering schedules" });
  }
});

// GET all class sections for dropdown
router.get("/class-sections", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cs.id,
        cs.section_name,
        cs.semester,
        cs.academic_year,
        cs.max_students,
        c.course_code,
        c.course_name,
        u.name AS teacher_name
      FROM class_sections cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE cs.is_active = true
      ORDER BY cs.academic_year DESC, cs.semester, c.course_code, cs.section_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get class sections error:", error.message);
    res.status(500).json({ message: "Server error fetching class sections" });
  }
});

// POST create new schedule
router.post("/", async (req, res) => {
  try {
    const {
      class_section_id,
      room_id,
      day_of_week,
      start_time,
      end_time
    } = req.body;

    if (!class_section_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        message: "Class section, day of week, start time, and end time are required"
      });
    }

    // Validate day_of_week is between 1-7
    if (day_of_week < 1 || day_of_week > 7) {
      return res.status(400).json({
        message: "Day of week must be between 1 (Monday) and 7 (Sunday)"
      });
    }

    // Check if class section exists
    const classSectionExists = await pool.query(
      'SELECT id FROM class_sections WHERE id = $1 AND is_active = true',
      [class_section_id]
    );
    if (classSectionExists.rows.length === 0) {
      return res.status(404).json({ message: "Class section not found" });
    }

    // Check for schedule conflicts with same class section
    const conflictQuery = `
      SELECT id FROM schedules
      WHERE class_section_id = $1 AND day_of_week = $2 AND is_active = true
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `;

    const conflictResult = await pool.query(conflictQuery, [
      class_section_id, day_of_week, start_time, end_time
    ]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({ message: "Schedule conflict: Class section already has a schedule at this time" });
    }

    // Check room availability if room_id is provided
    if (room_id) {
      const roomConflictQuery = `
        SELECT id FROM schedules
        WHERE room_id = $1 AND day_of_week = $2 AND is_active = true
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
      `;

      const roomConflictResult = await pool.query(roomConflictQuery, [
        room_id, day_of_week, start_time, end_time
      ]);

      if (roomConflictResult.rows.length > 0) {
        return res.status(409).json({ message: "Room is not available at this time" });
      }
    }

    const result = await pool.query(`
      INSERT INTO schedules (
        class_section_id, room_id, day_of_week, start_time, end_time, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, class_section_id, room_id, day_of_week, start_time, end_time, is_active, created_at
    `, [
      class_section_id, room_id, day_of_week, start_time, end_time
    ]);

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error("Create schedule error:", error.message);
    res.status(500).json({ message: "Server error creating schedule" });
  }
});

// PUT update existing schedule
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      class_section_id,
      room_id,
      day_of_week,
      start_time,
      end_time
    } = req.body;

    if (!class_section_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        message: "Class section, day of week, start time, and end time are required"
      });
    }

    // Validate day_of_week is between 1-7
    if (day_of_week < 1 || day_of_week > 7) {
      return res.status(400).json({
        message: "Day of week must be between 1 (Monday) and 7 (Sunday)"
      });
    }

    const scheduleExists = await pool.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (scheduleExists.rows.length === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if class section exists
    const classSectionExists = await pool.query(
      'SELECT id FROM class_sections WHERE id = $1 AND is_active = true',
      [class_section_id]
    );
    if (classSectionExists.rows.length === 0) {
      return res.status(404).json({ message: "Class section not found" });
    }

    // Check for schedule conflicts with same class section (excluding current schedule)
    const conflictQuery = `
      SELECT id FROM schedules
      WHERE class_section_id = $1 AND day_of_week = $2 AND is_active = true AND id != $5
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `;

    const conflictResult = await pool.query(conflictQuery, [
      class_section_id, day_of_week, start_time, end_time, id
    ]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({ message: "Schedule conflict: Class section already has a schedule at this time" });
    }

    // Check room availability if room_id is provided (excluding current schedule)
    if (room_id) {
      const roomConflictQuery = `
        SELECT id FROM schedules
        WHERE room_id = $1 AND day_of_week = $2 AND is_active = true AND id != $5
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
      `;

      const roomConflictResult = await pool.query(roomConflictQuery, [
        room_id, day_of_week, start_time, end_time, id
      ]);

      if (roomConflictResult.rows.length > 0) {
        return res.status(409).json({ message: "Room is not available at this time" });
      }
    }

    const result = await pool.query(`
      UPDATE schedules
      SET
        class_section_id = $1,
        room_id = $2,
        day_of_week = $3,
        start_time = $4,
        end_time = $5
      WHERE id = $6
      RETURNING id, class_section_id, room_id, day_of_week, start_time, end_time, is_active, created_at
    `, [
      class_section_id, room_id, day_of_week, start_time, end_time, id
    ]);

    res.json({
      message: 'Schedule updated successfully',
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error("Update schedule error:", error.message);
    res.status(500).json({ message: "Server error updating schedule" });
  }
});

// DELETE schedule (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const scheduleExists = await pool.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (scheduleExists.rows.length === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Soft delete by setting is_active to false
    await pool.query('UPDATE schedules SET is_active = false WHERE id = $1', [id]);

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Delete schedule error:", error.message);
    res.status(500).json({ message: "Server error deleting schedule" });
  }
});

module.exports = router;