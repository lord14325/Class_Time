const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all class sections with full details
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cs.id,
        cs.section_name,
        cs.semester,
        cs.academic_year,
        cs.max_students,
        cs.is_active,
        cs.created_at,
        c.id as course_id,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        t.id as teacher_id,
        t.employee_id,
        u.name AS teacher_name,
        u.email as teacher_email
      FROM class_sections cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE cs.is_active = true AND c.is_active = true
      ORDER BY cs.academic_year DESC, cs.semester, c.course_code, cs.section_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get class sections error:", error.message);
    res.status(500).json({ message: "Server error fetching class sections" });
  }
});

// GET class sections by filters
router.get("/filter", async (req, res) => {
  try {
    const { course_id, teacher_id, semester, academic_year, department } = req.query;

    let query = `
      SELECT
        cs.id,
        cs.section_name,
        cs.semester,
        cs.academic_year,
        cs.max_students,
        cs.is_active,
        cs.created_at,
        c.id as course_id,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        t.id as teacher_id,
        t.employee_id,
        u.name AS teacher_name,
        u.email as teacher_email
      FROM class_sections cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE cs.is_active = true AND c.is_active = true
    `;

    const params = [];
    let paramCount = 0;

    if (course_id) {
      paramCount++;
      query += ` AND cs.course_id = $${paramCount}`;
      params.push(course_id);
    }

    if (teacher_id) {
      paramCount++;
      query += ` AND cs.teacher_id = $${paramCount}`;
      params.push(teacher_id);
    }

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

    if (department) {
      paramCount++;
      query += ` AND c.department = $${paramCount}`;
      params.push(department);
    }

    query += ` ORDER BY cs.academic_year DESC, cs.semester, c.course_code, cs.section_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Filter class sections error:", error.message);
    res.status(500).json({ message: "Server error filtering class sections" });
  }
});

// GET class section by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        cs.id,
        cs.section_name,
        cs.semester,
        cs.academic_year,
        cs.max_students,
        cs.is_active,
        cs.created_at,
        c.id as course_id,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        t.id as teacher_id,
        t.employee_id,
        u.name AS teacher_name,
        u.email as teacher_email
      FROM class_sections cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON cs.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE cs.id = $1 AND cs.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Class section not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get class section error:", error.message);
    res.status(500).json({ message: "Server error fetching class section" });
  }
});

// POST create new class section
router.post("/", async (req, res) => {
  try {
    const {
      course_id,
      teacher_id,
      section_name,
      semester,
      academic_year,
      max_students
    } = req.body;

    if (!course_id || !section_name || !semester || !academic_year) {
      return res.status(400).json({
        message: "Course ID, section name, semester, and academic year are required"
      });
    }

    // Check if course exists
    const courseExists = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND is_active = true',
      [course_id]
    );
    if (courseExists.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if teacher exists (if provided)
    if (teacher_id) {
      const teacherExists = await pool.query(
        'SELECT id FROM teachers WHERE id = $1',
        [teacher_id]
      );
      if (teacherExists.rows.length === 0) {
        return res.status(404).json({ message: "Teacher not found" });
      }
    }

    // Check for duplicate section name for same course, semester, and academic year
    const duplicateCheck = await pool.query(`
      SELECT id FROM class_sections
      WHERE course_id = $1 AND section_name = $2 AND semester = $3 AND academic_year = $4 AND is_active = true
    `, [course_id, section_name, semester, academic_year]);

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: "A class section with this name already exists for this course in the specified semester and academic year"
      });
    }

    const result = await pool.query(`
      INSERT INTO class_sections (
        course_id, teacher_id, section_name, semester, academic_year, max_students, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, course_id, teacher_id, section_name, semester, academic_year, max_students, is_active, created_at
    `, [
      course_id,
      teacher_id || null,
      section_name,
      semester,
      academic_year,
      max_students || 30
    ]);

    res.status(201).json({
      message: 'Class section created successfully',
      class_section: result.rows[0]
    });
  } catch (error) {
    console.error("Create class section error:", error.message);
    res.status(500).json({ message: "Server error creating class section" });
  }
});

// PUT update existing class section
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course_id,
      teacher_id,
      section_name,
      semester,
      academic_year,
      max_students
    } = req.body;

    if (!course_id || !section_name || !semester || !academic_year) {
      return res.status(400).json({
        message: "Course ID, section name, semester, and academic year are required"
      });
    }

    const classSectionExists = await pool.query('SELECT id FROM class_sections WHERE id = $1', [id]);
    if (classSectionExists.rows.length === 0) {
      return res.status(404).json({ message: "Class section not found" });
    }

    // Check if course exists
    const courseExists = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND is_active = true',
      [course_id]
    );
    if (courseExists.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if teacher exists (if provided)
    if (teacher_id) {
      const teacherExists = await pool.query(
        'SELECT id FROM teachers WHERE id = $1',
        [teacher_id]
      );
      if (teacherExists.rows.length === 0) {
        return res.status(404).json({ message: "Teacher not found" });
      }
    }

    // Check for duplicate section name (excluding current record)
    const duplicateCheck = await pool.query(`
      SELECT id FROM class_sections
      WHERE course_id = $1 AND section_name = $2 AND semester = $3 AND academic_year = $4 AND is_active = true AND id != $5
    `, [course_id, section_name, semester, academic_year, id]);

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: "A class section with this name already exists for this course in the specified semester and academic year"
      });
    }

    const result = await pool.query(`
      UPDATE class_sections
      SET
        course_id = $1,
        teacher_id = $2,
        section_name = $3,
        semester = $4,
        academic_year = $5,
        max_students = $6
      WHERE id = $7
      RETURNING id, course_id, teacher_id, section_name, semester, academic_year, max_students, is_active, created_at
    `, [
      course_id,
      teacher_id || null,
      section_name,
      semester,
      academic_year,
      max_students,
      id
    ]);

    res.json({
      message: 'Class section updated successfully',
      class_section: result.rows[0]
    });
  } catch (error) {
    console.error("Update class section error:", error.message);
    res.status(500).json({ message: "Server error updating class section" });
  }
});

// DELETE class section (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const classSectionExists = await pool.query('SELECT id FROM class_sections WHERE id = $1', [id]);
    if (classSectionExists.rows.length === 0) {
      return res.status(404).json({ message: "Class section not found" });
    }

    // Check if class section has active schedules
    const hasSchedules = await pool.query(
      'SELECT id FROM schedules WHERE class_section_id = $1 AND is_active = true',
      [id]
    );
    if (hasSchedules.rows.length > 0) {
      return res.status(409).json({
        message: "Cannot delete class section that has active schedules. Please remove schedules first."
      });
    }

    // Soft delete by setting is_active to false
    await pool.query('UPDATE class_sections SET is_active = false WHERE id = $1', [id]);

    res.json({ message: "Class section deleted successfully" });
  } catch (error) {
    console.error("Delete class section error:", error.message);
    res.status(500).json({ message: "Server error deleting class section" });
  }
});

module.exports = router;