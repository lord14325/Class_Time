const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/dashboard-stats', async (req, res) => {
  try {

    const teachersResult = await db.query('SELECT COUNT(*) as count FROM teachers');
    const totalTeachers = parseInt(teachersResult.rows[0].count);


    const studentsResult = await db.query('SELECT COUNT(*) as count FROM students');
    const totalStudents = parseInt(studentsResult.rows[0].count);

    const classesResult = await db.query('SELECT COUNT(*) as count FROM class_sections WHERE is_active = true');
    const totalClasses = parseInt(classesResult.rows[0].count);


    const roomsResult = await db.query('SELECT COUNT(*) as count FROM rooms WHERE is_available = true');
    const rooms = parseInt(roomsResult.rows[0].count);


    const coursesResult = await db.query('SELECT COUNT(*) as count FROM courses WHERE is_active = true');
    const courses = parseInt(coursesResult.rows[0].count);


    const announcementsResult = await db.query('SELECT COUNT(*) as count FROM announcements WHERE status = \'published\'');
    const announcements = parseInt(announcementsResult.rows[0].count);

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
    res.status(500).json({ error: 'Failed to fetch recent announcements' });
  }
});



module.exports = router;