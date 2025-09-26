const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all time slots
router.get('/timeslots', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM time_slots
            WHERE is_active = true
            ORDER BY slot_order
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.status(500).json({ error: 'Failed to fetch time slots' });
    }
});

// Get all rooms as class sections (simplified approach)
router.get('/sections', async (req, res) => {
    try {
        // Auto-create class sections for any rooms that don't have them
        await pool.query(`
            INSERT INTO class_sections (grade_level, section_name, room_id, student_capacity, is_active)
            SELECT
                CONCAT('Room ', r.room_number) as grade_level,
                'Main' as section_name,
                r.id as room_id,
                r.capacity as student_capacity,
                true as is_active
            FROM rooms r
            WHERE r.is_available = true
            AND NOT EXISTS (
                SELECT 1 FROM class_sections cs WHERE cs.room_id = r.id
            )
        `);

        // Now return all class sections
        const result = await pool.query(`
            SELECT cs.*, r.room_number, r.room_name
            FROM class_sections cs
            LEFT JOIN rooms r ON cs.room_id = r.id
            WHERE cs.is_active = true AND r.is_available = true
            ORDER BY r.room_number
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({ error: 'Failed to fetch sections' });
    }
});

// Get all courses grouped by grade level
router.get('/courses', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM courses
            ORDER BY grade_level, subject
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get all teachers grouped by subject
router.get('/teachers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, u.name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE u.role = 'teacher'
            ORDER BY t.subject, u.name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});

// Get daily schedule for a specific day
router.get('/schedule/:dayOfWeek', async (req, res) => {
    try {
        const { dayOfWeek } = req.params;
        const result = await pool.query(`
            SELECT
                ds.*,
                cs.grade_level,
                cs.section_name,
                ts.slot_name,
                ts.start_time,
                ts.end_time,
                ts.slot_order,
                c.course_name,
                c.course_code,
                c.subject,
                u.name as teacher_name,
                t.employee_id,
                r.room_number,
                r.room_name
            FROM daily_schedules ds
            JOIN class_sections cs ON ds.class_section_id = cs.id
            JOIN time_slots ts ON ds.time_slot_id = ts.id
            JOIN courses c ON ds.course_id = c.id
            JOIN teachers t ON ds.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN rooms r ON ds.room_id = r.id
            WHERE ds.day_of_week = $1 AND ds.is_active = true
            ORDER BY cs.grade_level, cs.section_name, ts.slot_order
        `, [dayOfWeek]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching daily schedule:', error);
        res.status(500).json({ error: 'Failed to fetch daily schedule' });
    }
});

// Get schedule for a specific class section
router.get('/schedule/section/:sectionId', async (req, res) => {
    try {
        const { sectionId } = req.params;
        const result = await pool.query(`
            SELECT
                ds.*,
                ts.slot_name,
                ts.start_time,
                ts.end_time,
                ts.slot_order,
                c.course_name,
                c.course_code,
                u.name as teacher_name
            FROM daily_schedules ds
            JOIN time_slots ts ON ds.time_slot_id = ts.id
            JOIN courses c ON ds.course_id = c.id
            JOIN teachers t ON ds.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE ds.class_section_id = $1 AND ds.is_active = true
            ORDER BY ds.day_of_week, ts.slot_order
        `, [sectionId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching section schedule:', error);
        res.status(500).json({ error: 'Failed to fetch section schedule' });
    }
});

// Create or update daily schedule for a class section
router.post('/schedule', async (req, res) => {
    try {
        const {
            class_section_id,
            time_slot_id,
            course_id,
            teacher_id,
            room_id,
            day_of_week
        } = req.body;

        // Check for conflicts
        const conflicts = await pool.query(`
            SELECT 'teacher' as conflict_type, u.name as conflict_name
            FROM daily_schedules ds
            JOIN teachers t ON ds.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE ds.teacher_id = $1 AND ds.time_slot_id = $2 AND ds.day_of_week = $3 AND ds.is_active = true

            UNION

            SELECT 'room' as conflict_type, r.room_name as conflict_name
            FROM daily_schedules ds
            JOIN rooms r ON ds.room_id = r.id
            WHERE ds.room_id = $4 AND ds.time_slot_id = $2 AND ds.day_of_week = $3 AND ds.is_active = true
        `, [teacher_id, time_slot_id, day_of_week, room_id]);

        if (conflicts.rows.length > 0) {
            return res.status(400).json({
                error: 'Schedule conflict detected',
                conflicts: conflicts.rows
            });
        }

        // Insert or update the schedule
        const result = await pool.query(`
            INSERT INTO daily_schedules (class_section_id, time_slot_id, course_id, teacher_id, room_id, day_of_week)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (class_section_id, time_slot_id, day_of_week)
            DO UPDATE SET
                course_id = EXCLUDED.course_id,
                teacher_id = EXCLUDED.teacher_id,
                room_id = EXCLUDED.room_id
            RETURNING *
        `, [class_section_id, time_slot_id, course_id, teacher_id, room_id, day_of_week]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating/updating schedule:', error);
        res.status(500).json({ error: 'Failed to create/update schedule' });
    }
});

// Delete a schedule entry
router.delete('/schedule/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE daily_schedules SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Schedule entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// Bulk update schedule for a class section (copy Monday's schedule to other days)
router.post('/schedule/bulk-copy', async (req, res) => {
    try {
        const { class_section_id, from_day, to_days } = req.body;

        // Get Monday's schedule for the class section
        const mondaySchedule = await pool.query(`
            SELECT time_slot_id, course_id, teacher_id, room_id
            FROM daily_schedules
            WHERE class_section_id = $1 AND day_of_week = $2 AND is_active = true
        `, [class_section_id, from_day]);

        // Insert for each target day
        for (const day of to_days) {
            for (const schedule of mondaySchedule.rows) {
                await pool.query(`
                    INSERT INTO daily_schedules (class_section_id, time_slot_id, course_id, teacher_id, room_id, day_of_week)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (class_section_id, time_slot_id, day_of_week)
                    DO UPDATE SET
                        course_id = EXCLUDED.course_id,
                        teacher_id = EXCLUDED.teacher_id,
                        room_id = EXCLUDED.room_id
                `, [class_section_id, schedule.time_slot_id, schedule.course_id, schedule.teacher_id, schedule.room_id, day]);
            }
        }

        res.json({ message: 'Schedule copied successfully to selected days' });
    } catch (error) {
        console.error('Error copying schedule:', error);
        res.status(500).json({ error: 'Failed to copy schedule' });
    }
});

// Copy entire day schedule to multiple days (for all class sections)
router.post('/schedule/copy-day-to-week', async (req, res) => {
    try {
        const { from_day, to_days } = req.body;

        const sourceSchedules = await pool.query(`
            SELECT class_section_id, time_slot_id, course_id, teacher_id, room_id
            FROM daily_schedules
            WHERE day_of_week = $1 AND is_active = true
        `, [from_day]);

        if (sourceSchedules.rows.length === 0) {
            return res.status(400).json({ error: 'No schedules found for the source day' });
        }

        let copiedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const day of to_days) {
            await pool.query('DELETE FROM daily_schedules WHERE day_of_week = $1', [day]);

            for (const schedule of sourceSchedules.rows) {
                try {
                    await pool.query(`
                        INSERT INTO daily_schedules (class_section_id, time_slot_id, course_id, teacher_id, room_id, day_of_week)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [schedule.class_section_id, schedule.time_slot_id, schedule.course_id, schedule.teacher_id, schedule.room_id, day]);
                    copiedCount++;
                } catch (insertError) {
                    errorCount++;
                    errors.push(`Day ${day}, Section ${schedule.class_section_id}, Slot ${schedule.time_slot_id}: ${insertError.message}`);
                }
            }
        }

        res.json({
            message: `Successfully copied ${copiedCount} schedule entries from day ${from_day} to days ${to_days.join(', ')}. ${errorCount} errors occurred.`,
            copiedCount,
            errorCount,
            errors: errors.slice(0, 5)
        });
    } catch (error) {
        console.error('Error copying day schedule:', error);
        res.status(500).json({ error: 'Failed to copy day schedule: ' + error.message });
    }
});

// Get teacher availability for a specific time slot and day
router.get('/availability/teacher/:teacherId/slot/:slotId/day/:dayOfWeek', async (req, res) => {
    try {
        const { teacherId, slotId, dayOfWeek } = req.params;

        const result = await pool.query(`
            SELECT COUNT(*) as conflict_count
            FROM daily_schedules
            WHERE teacher_id = $1 AND time_slot_id = $2 AND day_of_week = $3 AND is_active = true
        `, [teacherId, slotId, dayOfWeek]);

        res.json({ available: result.rows[0].conflict_count === '0' });
    } catch (error) {
        console.error('Error checking teacher availability:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
});

// Create a new time slot
router.post('/timeslots', async (req, res) => {
    try {
        const { slot_name, start_time, end_time, slot_order } = req.body;

        if (!slot_name || !start_time || !end_time || !slot_order) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const result = await pool.query(`
            INSERT INTO time_slots (slot_name, start_time, end_time, slot_order, is_active)
            VALUES ($1, $2, $3, $4, true)
            RETURNING *
        `, [slot_name, start_time, end_time, slot_order]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating time slot:', error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'Slot order already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create time slot' });
        }
    }
});

// Update a time slot
router.put('/timeslots/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { slot_name, start_time, end_time, slot_order } = req.body;

        if (!slot_name || !start_time || !end_time || !slot_order) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const result = await pool.query(`
            UPDATE time_slots
            SET slot_name = $1, start_time = $2, end_time = $3, slot_order = $4
            WHERE id = $5
            RETURNING *
        `, [slot_name, start_time, end_time, slot_order, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Time slot not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating time slot:', error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'Slot order already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update time slot' });
        }
    }
});

// Delete a time slot
router.delete('/timeslots/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if time slot is used in any schedules
        const scheduleCheck = await pool.query(`
            SELECT COUNT(*) as count
            FROM daily_schedules
            WHERE time_slot_id = $1 AND is_active = true
        `, [id]);

        if (parseInt(scheduleCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete time slot that is currently used in schedules'
            });
        }

        const result = await pool.query(`
            DELETE FROM time_slots WHERE id = $1 RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Time slot not found' });
        }

        res.json({ message: 'Time slot deleted successfully' });
    } catch (error) {
        console.error('Error deleting time slot:', error);
        res.status(500).json({ error: 'Failed to delete time slot' });
    }
});

// student personal schedule...........................................
// routes/scheduling.js
router.get("/student/:userId/schedule", async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (!userIdNum || isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Step 1: Get student's grade_level and section from `students` table
    const studentRes = await pool.query(
      `SELECT s.grade_level, s.section
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE u.id = $1`,
      [userIdNum]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const { grade_level, section } = studentRes.rows[0];

    if (!grade_level || !section) {
      return res.status(400).json({ error: "Student has no grade or section assigned" });
    }

    // Step 2: Find matching class section
    const classSectionRes = await pool.query(
      `SELECT id FROM class_sections 
       WHERE grade_level = $1 AND section_name = $2 AND is_active = true`,
      [grade_level, section]
    );

    if (classSectionRes.rows.length === 0) {
      return res.status(404).json({ error: "No active class section found for student" });
    }

    const classSectionId = classSectionRes.rows[0].id;

    // Step 3: Fetch schedule for this class section
    const query = `
      SELECT 
        ds.day_of_week,
        ts.start_time,
        ts.end_time,
        c.course_name,
        u.name AS teacher_name,
        r.room_number,
        cs.grade_level,
        cs.section_name
      FROM daily_schedules ds
      JOIN time_slots ts ON ds.time_slot_id = ts.id
      JOIN courses c ON ds.course_id = c.id
      JOIN teachers t ON ds.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN class_sections cs ON ds.class_section_id = cs.id
      LEFT JOIN rooms r ON ds.room_id = r.id
      WHERE ds.class_section_id = $1
        AND ds.is_active = true
      ORDER BY ds.day_of_week, ts.slot_order
    `;

    const result = await pool.query(query, [classSectionId]);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Student schedule error:", error);
    console.error("Stack trace:", error.stack);

    if (error.code === '42P01') {
      return res.status(500).json({ error: "Database table missing" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
// Teacher personal...........................................

router.get('/teacher-by-user/:userId/schedule', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Find teacher row for this user
    const teacherRes = await pool.query('SELECT id FROM teachers WHERE user_id = $1 LIMIT 1', [userId]);
    if (teacherRes.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found for given userId' });
    }
    const teacherId = teacherRes.rows[0].id;

    // Fetch schedule using the teacher id
    const query = `
      SELECT 
        ds.day_of_week,
        ts.start_time,
        ts.end_time,
        ts.slot_order,
        c.course_name,
        c.course_code,
        u.name AS teacher_name,
        r.room_number,
        r.room_name,
        cs.grade_level,
        cs.section_name
      FROM daily_schedules ds
      JOIN time_slots ts ON ds.time_slot_id = ts.id
      JOIN courses c ON ds.course_id = c.id
      JOIN class_sections cs ON ds.class_section_id = cs.id
      LEFT JOIN rooms r ON cs.room_id = r.id
      LEFT JOIN teachers t ON ds.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE ds.teacher_id = $1 
        AND ds.is_active = true
        AND ds.day_of_week BETWEEN 0 AND 6
      ORDER BY ds.day_of_week, ts.slot_order
    `;
    const schedRes = await pool.query(query, [teacherId]);
    return res.json(schedRes.rows || []);
  } catch (err) {
    console.error('Error in teacher-by-user schedule route:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;