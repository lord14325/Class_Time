const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        content,
        target_audience,
        status
      FROM announcements
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get announcements error:", error.message);
    res.status(500).json({ message: "Server error fetching announcements" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        id,
        title,
        content,
        target_audience,
        status
      FROM announcements
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get announcement error:", error.message);
    res.status(500).json({ message: "Server error fetching announcement" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      content,
      target_audience = 'all',
      status = 'published'
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Please provide title and content"
      });
    }

    const result = await pool.query(`
      INSERT INTO announcements (title, content, target_audience, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, content, target_audience, status
    `, [
      title,
      content,
      target_audience,
      status
    ]);

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: result.rows[0]
    });

  } catch (error) {
    console.error("Create announcement error:", error.message);
    res.status(500).json({ message: "Server error creating announcement" });
  }
});

// PUT update existing announcement
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      target_audience,
      status
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Please provide title and content"
      });
    }


    const result = await pool.query(`
      UPDATE announcements
      SET
        title = $1,
        content = $2,
        target_audience = $3,
        status = $4
      WHERE id = $5
      RETURNING id, title, content, target_audience, status
    `, [
      title,
      content,
      target_audience,
      status,
      id
    ]);

    res.json({
      message: "Announcement updated successfully",
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error("Update announcement error:", error.message);
    res.status(500).json({ message: "Server error updating announcement" });
  }
});

// DELETE announcement
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;


    await pool.query('DELETE FROM announcements WHERE id = $1', [id]);

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error.message);
    res.status(500).json({ message: "Server error deleting announcement" });
  }
});

module.exports = router;