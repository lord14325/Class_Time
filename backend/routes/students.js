const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.student_id, s.grade_level, s.enrollment_date, s.phone, s.address,
             u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.enrollment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get students error:", error.message);
    res.status(500).json({ message: "Server error fetching students" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.id, s.student_id, s.grade_level, s.enrollment_date, s.phone, s.address,
             u.name, u.email, u.role
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get student error:", error.message);
    res.status(500).json({ message: "Server error fetching student" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      student_id,
      grade_level,
      phone,
      address,
      enrollment_date
    } = req.body;

    if (!name || !email || !username || !password || !student_id || !grade_level || !phone || !address || !enrollment_date) {
      return res.status(400).json({
        message: "All fields are required: name, email, username, password, student_id, grade_level, phone, address, and enrollment_date"
      });
    }

    const userResult = await pool.query(`
      INSERT INTO users (name, email, username, password, role, created_at)
      VALUES ($1, $2, $3, $4, 'student', NOW())
      RETURNING id
    `, [name, email, username, password]);

    const userId = userResult.rows[0].id;

    const studentResult = await pool.query(`
      INSERT INTO students (user_id, student_id, grade_level, phone, address, enrollment_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, student_id, grade_level, phone, address, enrollment_date]);

    const newStudent = {
      ...studentResult.rows[0],
      name,
      email,
      username
    };

    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Create student error:", error.message);
    if (error.code === '23505') {
      res.status(400).json({ message: "Email, username, or student ID already exists" });
    } else {
      res.status(500).json({ message: "Server error creating student" });
    }
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      username,
      password,
      student_id,
      grade_level,
      phone,
      address,
      enrollment_date
    } = req.body;

    const studentCheck = await pool.query('SELECT user_id FROM students WHERE id = $1', [id]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = studentCheck.rows[0].user_id;

    await pool.query(`
      UPDATE users
      SET name = $1, email = $2
      WHERE id = $3
    `, [name, email, userId]);

    await pool.query(`
      UPDATE students
      SET student_id = $1, grade_level = $2, phone = $3, address = $4
      WHERE id = $5
    `, [student_id, grade_level, phone || null, address || null, id]);

    const result = await pool.query(`
      SELECT s.id, s.student_id, s.grade_level, s.enrollment_date, s.phone, s.address,
             u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update student error:", error.message);
    res.status(500).json({ message: "Server error updating student" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const studentCheck = await pool.query('SELECT user_id FROM students WHERE id = $1', [id]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = studentCheck.rows[0].user_id;

    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error.message);
    res.status(500).json({ message: "Server error deleting student" });
  }
});

module.exports = router;