import React from "react";
import { FaChalkboardTeacher, FaUser, FaBook, FaCalendarAlt } from "react-icons/fa";
import { RiDashboardFill } from "react-icons/ri";
import { PiStudentBold } from "react-icons/pi";
import { MdAnnouncement, MdMeetingRoom } from "react-icons/md";
import { Link } from "react-router-dom";

import "../styles/SideBar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <Link to="/dashboard"><RiDashboardFill /> Dashboard</Link>
        <Link to="/room"><MdMeetingRoom /> Room</Link>
        <Link to="/teacher"><FaChalkboardTeacher /> Teacher</Link>
        <Link to="/student"><PiStudentBold /> Student</Link>
        <Link to="/course"><FaBook /> Course</Link>
        <Link to="/schedule"><FaCalendarAlt /> Schedule</Link>
        <Link to="/announcements"><MdAnnouncement /> Announcements</Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
