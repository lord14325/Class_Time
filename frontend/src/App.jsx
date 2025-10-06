// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import UserSelection from './Pages/UserSelection';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard'; // Admin
import StudentDashboard from './Pages/StudentDashboard';
import TeacherDashboard from './Pages/TeacherDashboard';
import Room from './Pages/Room';
import Teacher from './Pages/Teacher';
import Student from './Pages/Student';
import Course from './Pages/Course';
import Announcements from './Pages/Announcements';
import AdminScheduling from './Pages/AdminScheduling'; 
import ProtectedRoute from './component/ProtectedRoute';



function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<UserSelection />} />
      <Route path="/login" element={<Login />} />

      {/* Role-Based Dashboards */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/student-dashboard" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      <Route path="/teacher-dashboard" element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      {/* Shared Read-Only Pages — accessible by all authenticated users */}
      <Route path="/schedule" element={
        <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
          <AdminScheduling /> {}
        </ProtectedRoute>
      } />

      <Route path="/announcements" element={
        <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
          <Announcements />
        </ProtectedRoute>
      } />

      {/* Admin-Only Management Pages */}
      <Route path="/room" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Room />
        </ProtectedRoute>
      } />

      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Teacher />
        </ProtectedRoute>
      } />

      <Route path="/student" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Student />
        </ProtectedRoute>
      } />

      <Route path="/course" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <Course />
        </ProtectedRoute>
      } />

      {/* Fallback / Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;