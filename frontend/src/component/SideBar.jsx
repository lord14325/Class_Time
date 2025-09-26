// src/component/SideBar.js
import React from "react";
import { FaChalkboardTeacher, FaBook, FaCalendarAlt } from "react-icons/fa";
import { RiDashboardFill } from "react-icons/ri";
import { PiStudentBold } from "react-icons/pi";
import { MdAnnouncement, MdMeetingRoom } from "react-icons/md";
import { Link } from "react-router-dom";
import "../styles/SideBar.css";

function SideBar() {
  const role = localStorage.getItem("role") || "guest";

  const renderNavItems = () => {
    switch (role) {
      case "admin":
        return (
          <>
            <Link to="/dashboard"><RiDashboardFill /> Dashboard</Link>
            <Link to="/room"><MdMeetingRoom /> Room</Link>
            <Link to="/teacher"><FaChalkboardTeacher /> Teacher</Link>
            <Link to="/student"><PiStudentBold /> Student</Link>
            <Link to="/course"><FaBook /> Course</Link>
            <Link to="/schedule"><FaCalendarAlt /> Schedule</Link>
            <Link to="/announcements"><MdAnnouncement /> Announcements</Link>
          </>
        );

      case "teacher":
        return (
          <>
            <Link to="/teacher-dashboard"><RiDashboardFill /> Dashboard</Link>
            <Link to="/schedule"><FaCalendarAlt /> My Schedule</Link>
            <Link to="/announcements"><MdAnnouncement /> Announcements</Link>
          </>
        );

      case "student":
        return (
          <>
            <Link to="/student-dashboard"><RiDashboardFill /> Dashboard</Link>
            <Link to="/schedule"><FaCalendarAlt /> My Schedule</Link>
            <Link to="/announcements"><MdAnnouncement /> Announcements</Link>
          </>
        );

      default:
        return <Link to="/login">Please Login</Link>;
    }
  };

  return (
    <aside className="sidebar">
      <nav>{renderNavItems()}</nav>
    </aside>
  );
}

export default SideBar;