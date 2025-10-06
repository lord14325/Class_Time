const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY course_code');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get courses" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { course_code, course_name, description, subject, grade_level } = req.body;

    const result = await pool.query(`
      INSERT INTO courses (course_code, course_name, description, subject, grade_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [course_code, course_name, description, subject, grade_level]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { course_code, course_name, description, subject, grade_level } = req.body;

    const result = await pool.query(`
      UPDATE courses
      SET course_code = $1, course_name = $2, description = $3, subject = $4, grade_level = $5
      WHERE id = $6
      RETURNING *
    `, [course_code, course_name, description, subject, grade_level, id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseExists.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if there are schedules using this course
    const schedulesWithCourse = await pool.query('SELECT COUNT(*) as count FROM daily_schedules WHERE course_id = $1', [id]);
    const scheduleCount = parseInt(schedulesWithCourse.rows[0].count);

    if (scheduleCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete course',
        scheduleCount
      });
    }

    // Delete the course if no dependencies exist
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});



module.exports = router;