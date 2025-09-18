const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/dashboard-stats', async (req, res) => {
  try {
    // Get total teachers
    const teachersResult = await db.query('SELECT COUNT(*) as count FROM teachers');
    const totalTeachers = parseInt(teachersResult.rows[0].count);

    // Get total students
    const studentsResult = await db.query('SELECT COUNT(*) as count FROM students');
    const totalStudents = parseInt(studentsResult.rows[0].count);

    // Get total classes (using rooms as proxy since we don't have class_sections table yet)
    const classesResult = await db.query('SELECT COUNT(*) as count FROM rooms');
    const totalClasses = parseInt(classesResult.rows[0].count);

    // Get available rooms
    const roomsResult = await db.query('SELECT COUNT(*) as count FROM rooms WHERE is_available = true');
    const rooms = parseInt(roomsResult.rows[0].count);

    // Get total courses (removed is_active filter since new schema doesn't have it)
    const coursesResult = await db.query('SELECT COUNT(*) as count FROM courses');
    const courses = parseInt(coursesResult.rows[0].count);

    // Get announcements (set to 0 for now since table might not exist)
    let announcements = 0;
    try {
      const announcementsResult = await db.query('SELECT COUNT(*) as count FROM announcements WHERE status = \'published\'');
      announcements = parseInt(announcementsResult.rows[0].count);
    } catch (err) {
      // Table doesn't exist, keep announcements as 0
      console.log('Announcements table not found, setting count to 0');
    }

    res.json({
      totalTeachers,
      totalStudents,
      totalClasses,
      rooms,
      courses,
      announcements
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});


router.get('/recent-announcements', async (req, res) => {
  try {
    const query = `
      SELECT title, content, target_audience, announcement_date, status
      FROM announcements
      WHERE status = 'published'
      ORDER BY announcement_date DESC, created_at DESC
      LIMIT 5
    `;

    const result = await db.query(query);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching recent announcements:', error);
    // Return empty array if table doesn't exist
    res.json([]);
  }
});



module.exports = router;