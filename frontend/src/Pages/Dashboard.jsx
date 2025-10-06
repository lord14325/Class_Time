import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../component/Layout";
import StatCard from "../component/StatCard";

import "../styles/Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await fetch("http://localhost:5000/api/dashboard/dashboard-stats");
        const statsData = await statsResponse.json();

        const statsArray = [
          { title: "Total Teachers", value: statsData.totalTeachers },
          { title: "Total Students", value: statsData.totalStudents },
          { title: "Total Classes", value: statsData.totalClasses },
          { title: "Rooms", value: statsData.rooms },
          { title: "Courses", value: statsData.courses },
          { title: "Announcements", value: statsData.announcements },
        ];
        setStats(statsArray);


      } catch (err) {
        console.error("Error fetching dashboard data:", err);
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

    fetchData();
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
          ) : (
            stats.map((s, i) => (
              <StatCard key={s.title} title={s.title} value={s.value} />
            ))
          )}
        </div>
        {/* QUICKACTION SECTION */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <ul>
            <li><Link to="/teacher">Add Teacher</Link></li>
            <li><Link to="/schedule">Admin Scheduling</Link></li>
            <li><Link to="/announcements">Add Announcement</Link></li>
          </ul>
        </section>

    </Layout>
  );
}

export default Dashboard;
