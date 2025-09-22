const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const pool = require("./db");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/teachers", require("./routes/teachers"));
app.use("/api/students", require("./routes/students"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/scheduling", require("./routes/scheduling"));

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});