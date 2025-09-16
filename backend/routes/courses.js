const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all courses
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        course_code,
        course_name,
        description,
        credits,
        department,
        is_active,
        created_at
      FROM courses
      ORDER BY course_code ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get courses error:", error.message);
    res.status(500).json({ message: "Server error fetching courses" });
  }
});


// POST create new course
router.post("/", async (req, res) => {
  try {
    const {
      course_code,
      course_name,
      description,
      credits,
      department,
      is_active
    } = req.body;

    if (!course_code || !course_name || !department) {
      return res.status(400).json({ message: "Course code, name, and department are required" });
    }

    const result = await pool.query(`
      INSERT INTO courses (course_code, course_name, description, credits, department, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, course_code, course_name, description, credits, department, is_active, created_at
    `, [
      course_code,
      course_name,
      description,
      credits || 3,
      department,
      is_active !== undefined ? is_active : true
    ]);

    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error("Create course error:", error.message);
    res.status(500).json({ message: "Server error creating course" });
  }
});

// PUT update existing course
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course_code,
      course_name,
      description,
      credits,
      department,
      is_active
    } = req.body;

    if (!course_code || !course_name || !department) {
      return res.status(400).json({ message: "Course code, name, and department are required" });
    }

    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseExists.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const result = await pool.query(`
      UPDATE courses
      SET
        course_code = $1,
        course_name = $2,
        description = $3,
        credits = $4,
        department = $5,
        is_active = $6
      WHERE id = $7
      RETURNING id, course_code, course_name, description, credits, department, is_active, created_at
    `, [
      course_code,
      course_name,
      description,
      credits || 3,
      department,
      is_active !== undefined ? is_active : true,
      id
    ]);

    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error("Update course error:", error.message);
    res.status(500).json({ message: "Server error updating course" });
  }
});

// DELETE course
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseExists.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    await pool.query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error.message);
    res.status(500).json({ message: "Server error deleting course" });
  }
});



module.exports = router;