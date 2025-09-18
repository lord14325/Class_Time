import React from "react";
import { Routes, Route } from "react-router-dom";
import UserSelection from './Pages/UserSelection';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import StudentDashboard from './Pages/StudentDashboard';
import TeacherDashboard from './Pages/TeacherDashboard';
import Room from './Pages/Room';
import Teacher from './Pages/Teacher';
import Student from './Pages/Student';
import Course from './Pages/Course';
import ClassSections from './Pages/ClassSections';
import Schedule from './Pages/Schedule';
import Announcements from '../src/Pages/Announcements';

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserSelection />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/room" element={<Room />} />
      <Route path="/teacher" element={<Teacher />} />
      <Route path="/student" element={<Student />} />
      <Route path="/course" element={<Course />} />
      <Route path="/class-sections" element={<ClassSections />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/announcements" element={<Announcements />} />
    </Routes>
  );
}

export default App;
