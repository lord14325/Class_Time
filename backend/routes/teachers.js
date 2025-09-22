const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.employee_id, t.phone, t.subject, u.name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get teachers" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.employee_id, t.phone, t.subject, u.name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [req.params.id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to get teacher" });
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

    res.json(newTeacher);
  } catch (error) {
    res.status(500).json({ error: "Failed to create teacher" });
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