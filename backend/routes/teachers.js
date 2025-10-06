const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.employee_id,
        t.phone,
        t.subject,
        COALESCE(t.subjects, ARRAY[t.subject]) as subjects,
        array_to_string(COALESCE(t.subjects, ARRAY[t.subject]), ', ') as subjects_display,
        u.name,
        u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get teachers" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.employee_id,
        t.phone,
        t.subject,
        COALESCE(t.subjects, ARRAY[t.subject]) as subjects,
        u.id as user_id,
        u.name,
        u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE u.id = $1
    `, [req.params.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching teacher by user ID:", error);
    res.status(500).json({ error: "Failed to get teacher" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.employee_id,
        t.phone,
        t.subject,
        COALESCE(t.subjects, ARRAY[t.subject]) as subjects,
        u.name,
        u.email
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
      subject,
      subjects
    } = req.body;


    const userResult = await pool.query(`
      INSERT INTO users (name, email, username, password, role, created_at)
      VALUES ($1, $2, $3, $4, 'teacher', NOW())
      RETURNING id
    `, [name, email, username, password]);

    const userId = userResult.rows[0].id;

    const teacherSubjects = subjects || [subject];
    const primarySubject = teacherSubjects[0] || subject;

    const teacherResult = await pool.query(`
      INSERT INTO teachers (user_id, employee_id, phone, subject, subjects, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [userId, employee_id, phone, primarySubject, teacherSubjects]);

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
      subject,
      subjects
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

    const teacherSubjects = subjects || [subject];
    const primarySubject = teacherSubjects[0] || subject;

    await pool.query(`
      UPDATE teachers
      SET employee_id = $1, phone = $2, subject = $3, subjects = $4
      WHERE id = $5
    `, [employee_id, phone, primarySubject, teacherSubjects, id]);

    const result = await pool.query(`
      SELECT
        t.id,
        t.employee_id,
        t.phone,
        t.subject,
        COALESCE(t.subjects, ARRAY[t.subject]) as subjects,
        t.created_at,
        u.name,
        u.email
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

    // Check if it's a foreign key constraint violation
    if (error.code === '23503') {
      return res.status(400).json({
        message: "Cannot delete teacher. This teacher has classes assigned and must be unassigned first."
      });
    }

    res.status(500).json({ message: "Server error deleting teacher" });
  }
});

module.exports = router;