import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../component/Layout";
import StatCard from "../component/StatCard";

import "../styles/Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/dashboard/dashboard-stats");
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
                const statsArray = [
          { title: "Total Teachers", value: data.totalTeachers },
          { title: "Total Students", value: data.totalStudents },
          { title: "Total Classes", value: data.totalClasses },
          { title: "Rooms", value: data.rooms },
          { title: "Courses", value: data.courses },
          { title: "Announcements", value: data.announcements },
        ];
        setStats(statsArray);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err.message);
        setStats([
          { title: "Total Teachers", value: 0 },
          { title: "Total Students", value: 0 },
          { title: "Total Classes", value: 0 },
          { title: "Rooms", value: 0 },
          { title: "Courses", value: 0 },
          { title: "Announcements", value: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
        <div className="dashboard-welcome">
          <h1>Welcome, Admin!</h1>
        </div>
        {/* STATCARD SECTION  */}
        <div className="stats">
          {loading ? (
            <p>Loading dashboard statistics...</p>
          ) : error ? (
            <p>Error loading stats: {error}</p>
          ) : (
            stats.map((s, i) => (
              <StatCard key={i} title={s.title} value={s.value} />
            ))
          )}
        </div>
        {/* QUICKACTION SECTION */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <ul>
            <li><Link to="/teacher">Add Teacher</Link></li>
            <li><Link to="/class-sections">Manage Class Sections</Link></li>
            <li><Link to="/schedule">Admin Scheduling</Link></li>
            <li><Link to="/announcements">Add Announcement</Link></li>
          </ul>
        </section>
    </Layout>
  );
}

export default Dashboard;
