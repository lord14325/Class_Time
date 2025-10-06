const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                s.id,
                s.student_id,
                s.grade_level,
                s.section,
                s.phone,
                s.address,
                s.enrollment_date,
                s.room_id,
                u.id as user_id,
                u.name,
                u.email,
                u.username,
                r.room_number
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE u.role = 'student'
            ORDER BY s.student_id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get student by user_id
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT
                s.id,
                s.student_id,
                s.grade_level,
                s.section,
                s.phone,
                s.address,
                s.enrollment_date,
                s.room_id,
                u.id as user_id,
                u.name,
                u.email,
                u.username,
                r.room_number
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE u.id = $1
        `;
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching student by user ID:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT
                s.id,
                s.student_id,
                s.grade_level,
                s.section,
                s.phone,
                s.address,
                s.enrollment_date,
                s.room_id,
                u.id as user_id,
                u.name,
                u.email,
                u.username,
                r.room_number
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE s.id = $1
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// Create new student
router.post('/', async (req, res) => {
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
            enrollment_date,
            room_id,
            section
        } = req.body;

        // Validate required fields
        if (!name || !email || !username || !password || !student_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if username or email already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Check if student_id already exists
        const existingStudent = await pool.query(
            'SELECT id FROM students WHERE student_id = $1',
            [student_id]
        );

        if (existingStudent.rows.length > 0) {
            return res.status(400).json({ error: 'Student ID already exists' });
        }

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Create user
            const userResult = await pool.query(
                `INSERT INTO users (name, email, username, password, role)
                 VALUES ($1, $2, $3, $4, 'student')
                 RETURNING id`,
                [name, email, username, password]
            );

            const userId = userResult.rows[0].id;

            // Create student
            const studentResult = await pool.query(
                `INSERT INTO students (
                    user_id, student_id, grade_level, phone, address,
                    enrollment_date, room_id, section
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    userId, student_id, grade_level, phone, address,
                    enrollment_date || new Date(), room_id, section
                ]
            );

            // Auto-sync class_sections after student creation
            if (room_id && grade_level && section) {
                const checkExists = await pool.query(`
                    SELECT id FROM class_sections
                    WHERE room_id = $1 AND grade_level = $2 AND section_name = $3 AND is_active = true
                `, [room_id, grade_level, section]);

                if (checkExists.rows.length === 0) {
                    await pool.query(`
                        INSERT INTO class_sections (grade_level, section_name, room_id, student_capacity, is_active)
                        VALUES ($1, $2, $3, 30, true)
                    `, [grade_level, section, room_id]);
                }
            }

            await pool.query('COMMIT');

            // Fetch complete student data
            const completeStudent = await pool.query(
                `SELECT
                    s.id,
                    s.student_id,
                    s.grade_level,
                    s.section,
                    s.phone,
                    s.address,
                    s.enrollment_date,
                    s.room_id,
                    u.id as user_id,
                    u.name,
                    u.email,
                    u.username,
                    r.room_number
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN rooms r ON s.room_id = r.id
                WHERE s.id = $1`,
                [studentResult.rows[0].id]
            );

            res.status(201).json(completeStudent.rows[0]);
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// Update student
router.put('/:id', async (req, res) => {
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
            enrollment_date,
            room_id,
            section
        } = req.body;

        // Get student's user_id
        const studentResult = await pool.query(
            'SELECT user_id FROM students WHERE id = $1',
            [id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const userId = studentResult.rows[0].user_id;

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Update user information
            let updateUserQuery = `
                UPDATE users
                SET name = $1, email = $2, username = $3
            `;
            let userParams = [name, email, username];

            if (password) {
                updateUserQuery += ', password = $4';
                userParams.push(password);
            }

            updateUserQuery += ' WHERE id = $' + (userParams.length + 1);
            userParams.push(userId);

            await pool.query(updateUserQuery, userParams);

            // Update student information
            await pool.query(
                `UPDATE students
                 SET student_id = $1, grade_level = $2, phone = $3, address = $4,
                     enrollment_date = $5, room_id = $6, section = $7
                 WHERE id = $8`,
                [student_id, grade_level, phone, address, enrollment_date, room_id, section, id]
            );

            // Auto-sync class_sections after student update
            if (room_id && grade_level && section) {
                const checkExists = await pool.query(`
                    SELECT id FROM class_sections
                    WHERE room_id = $1 AND grade_level = $2 AND section_name = $3 AND is_active = true
                `, [room_id, grade_level, section]);

                if (checkExists.rows.length === 0) {
                    await pool.query(`
                        INSERT INTO class_sections (grade_level, section_name, room_id, student_capacity, is_active)
                        VALUES ($1, $2, $3, 30, true)
                    `, [grade_level, section, room_id]);
                }
            }

            await pool.query('COMMIT');

            // Fetch updated student data
            const updatedStudent = await pool.query(
                `SELECT
                    s.id,
                    s.student_id,
                    s.grade_level,
                    s.section,
                    s.phone,
                    s.address,
                    s.enrollment_date,
                    s.room_id,
                    u.id as user_id,
                    u.name,
                    u.email,
                    u.username,
                    r.room_number
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN rooms r ON s.room_id = r.id
                WHERE s.id = $1`,
                [id]
            );

            res.json(updatedStudent.rows[0]);
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get student's user_id
        const studentResult = await pool.query(
            'SELECT user_id FROM students WHERE id = $1',
            [id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const userId = studentResult.rows[0].user_id;

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Delete student record
            await pool.query('DELETE FROM students WHERE id = $1', [id]);

            // Delete user record
            await pool.query('DELETE FROM users WHERE id = $1', [userId]);

            await pool.query('COMMIT');
            res.json({ message: 'Student deleted successfully' });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

module.exports = router;