const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.employee_id, t.phone, t.subject, t.created_at,
             u.name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get teachers error:", error.message);
    res.status(500).json({ message: "Server error fetching teachers" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT t.id, t.employee_id, t.phone, t.subject, t.created_at,
             u.name, u.email, u.role
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get teacher error:", error.message);
    res.status(500).json({ message: "Server error fetching teacher" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      phone,
      employee_id,
      subject
    } = req.body;

    if (!name || !email || !username || !password || !employee_id || !phone || !subject) {
      return res.status(400).json({
        message: "All fields are required: name, email, username, password, employee_id, phone, and subject"
      });
    }

    const userResult = await pool.query(`
      INSERT INTO users (name, email, username, password, role, created_at)
      VALUES ($1, $2, $3, $4, 'teacher', NOW())
      RETURNING id
    `, [name, email, username, password]);

    const userId = userResult.rows[0].id;

    const teacherResult = await pool.query(`
      INSERT INTO teachers (user_id, employee_id, phone, subject, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [userId, employee_id, phone, subject]);

    const newTeacher = {
      ...teacherResult.rows[0],
      name,
      email,
      username
    };

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error("Create teacher error:", error.message);
    if (error.code === '23505') {
      res.status(400).json({ message: "Email, username, or employee ID already exists" });
    } else {
      res.status(500).json({ message: "Server error creating teacher" });
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
      phone,
      employee_id,
      subject
    } = req.body;

    const teacherCheck = await pool.query('SELECT user_id FROM teachers WHERE id = $1', [id]);

    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const userId = teacherCheck.rows[0].user_id;

    await pool.query(`
      UPDATE users
      SET name = $1, email = $2
      WHERE id = $3
    `, [name, email, userId]);

    await pool.query(`
      UPDATE teachers
      SET employee_id = $1, phone = $2, subject = $3
      WHERE id = $4
    `, [employee_id, phone, subject || null, id]);

    const result = await pool.query(`
      SELECT t.id, t.employee_id, t.phone, t.subject, t.created_at,
             u.name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update teacher error:", error.message);
    res.status(500).json({ message: "Server error updating teacher" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const teacherCheck = await pool.query('SELECT user_id FROM teachers WHERE id = $1', [id]);

    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const userId = teacherCheck.rows[0].user_id;

    await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Delete teacher error:", error.message);
    res.status(500).json({ message: "Server error deleting teacher" });
  }
});

module.exports = router;