import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../component/Layout";
import "../styles/Dashboard.css";
import "../styles/StudentDashboard.css";

function StudentDashboard() {
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = localStorage.getItem("userId");
        if (!userId || isNaN(parseInt(userId))) {
          throw new Error("Invalid or missing user ID. Please log in again.");
        }

        // Get current week's Monday
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const weekStart = monday.toISOString().split('T')[0];

        const [schedulesRes, announcementsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/scheduling/student/${userId}/schedule?weekStart=${weekStart}`),
          fetch(`http://localhost:5000/api/announcements`)
        ]);

        if (!schedulesRes.ok) {
          const text = await schedulesRes.text().catch(() => "");
          throw new Error(`Failed to load schedule: ${schedulesRes.status} ${text}`);
        }

        const schedulesData = await schedulesRes.json();

        const formatTime = (timeStr) => {
          if (!timeStr) return "—";
          const [hour, minute] = timeStr.split(':').map(Number);
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        };

        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const mappedSchedules = (schedulesData || []).map(s => {
          const dayName = s.day_of_week && typeof s.day_of_week === 'number'
            ? daysOfWeek[s.day_of_week]
            : s.day || "Unknown";

          return {
            day: dayName,
            time: `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
            courseName: s.course_name || s.courseName || "—",
            teacherName: s.teacher_name || s.teacherName || "—",
            room: s.room_number || s.room_name || "TBD",
            gradeLevel: s.grade_level || "",
            sectionName: s.section_name || ""
          };
        });

        setSchedules(mappedSchedules);

        if (announcementsRes.ok) {
          const ann = await announcementsRes.json();
          // Filter announcements for students only
          const filtered = (ann || []).filter(a =>
            a.target_audience === "all" || a.target_audience === "students"
          );
          const normalized = filtered.map(a => {
            let parsed = new Date(a.date);
            const isValid = parsed.toString() !== "Invalid Date";
            return {
              ...a,
              date: isValid ? parsed.toISOString() : null
            };
          });
          normalized.sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          });
          setAnnouncements(normalized);
        } else {
          setAnnouncements([]);
        }

      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTodayDayName = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  };

  const todaySchedule = schedules.filter(s => s.day === getTodayDayName());
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } })();
  const studentName = user?.name || "Student";

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-welcome">
          <h1>Welcome, {studentName}!</h1>
        </div>
        <p className="loading-text">Loading your schedule and announcements...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-welcome">
        <h1>Welcome, {studentName}!</h1>
        <p className="subtitle">Your class schedule and announcements at a glance.</p>
      </div>

      {error && (
        <div className="error-banner error-banner-style">
          <strong>Error:</strong> {error}
        </div>
      )}

      <section className="dashboard-section today-schedule">
        <h2>Today's Classes ({getTodayDayName()})</h2>
        {todaySchedule.length > 0 ? (
          <ul className="schedule-list">
            {todaySchedule.map((s, i) => (
              <li key={`today-${s.day}-${s.time}-${s.courseName}-${i}`} className="schedule-item">
                <div className="course-name">{s.courseName}</div>
                <div className="teacher">{s.teacherName}</div>
                <div className="time-location">{s.time} • Room {s.room}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-schedule">No classes scheduled for today.</p>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Your Weekly Class Schedule</h2>
        </div>

        <div className="timetable-container">
          {schedules.length > 0 ? (
            <div className="timetable-wrapper">
              <div className="timetable-header">
                <div className="time-cell"></div>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} className="day-header">
                    <strong>{day}</strong>
                  </div>
                ))}
              </div>
              {Object.entries(
                schedules.reduce((acc, s) => {
                  acc[s.time] = acc[s.time] || [];
                  acc[s.time].push(s);
                  return acc;
                }, {})
              ).map(([time, timeSchedules]) => (
                <div key={time} className="timetable-row">
                  <div className="time-cell">{time}</div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const classes = timeSchedules.filter(s => s.day === day);
                    return (
                      <div key={day} className="day-cell">
                        {classes.map((c, i) => (
                          <div key={`${day}-${time}-${c.courseName}-${c.teacherName}-${i}`} className="class-box">
                            <strong>{c.courseName}</strong>
                            <div className="teacher-room">
                              {c.teacherName && <span>{c.teacherName}</span>}
                              {c.room && <span> Room {c.room}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-schedule-warning">
              No schedule found. Please check with admin if you're enrolled in any classes.
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Announcements</h2>
        {announcements.length > 0 ? (
          <div className="announcements-container">
            {announcements.slice(0, 3).map((a, i) => (
              <div key={a.id || `announcement-${a.title}-${i}`} className="announcement-card">
                <div className="announcement-header">
                  <strong>{a.title}</strong>
                  <span className="date-badge">{a.date ? new Date(a.date).toLocaleDateString() : "—"}</span>
                </div>
                <p className="content">{a.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No announcements at this time.</p>
        )}
      </section>

      <section className="quick-actions">
        <h2>Quick Links</h2>
        <ul>
          <li><Link to="/schedule">View Full Schedule</Link></li>
          <li><Link to="/announcements">View All Announcements</Link></li>
        </ul>
      </section>
    </Layout>
  );
}

export default StudentDashboard;