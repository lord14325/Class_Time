const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password, expectedRole } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password"
      });
    }


    const query = `
      SELECT id, name, email, username, role
      FROM users
      WHERE username = $1 AND password = $2
    `;

    const result = await pool.query(query, [username, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const user = result.rows[0];

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have ${expectedRole} privileges.`
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = `
      SELECT id, name, email, username, role 
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get user error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;