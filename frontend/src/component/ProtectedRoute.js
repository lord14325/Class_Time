// src/component/ProtectedRoute.js
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = localStorage.getItem("role");

  // Redirect to login if not logged in
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to unauthorized or dashboard if role not allowed
  if (!allowedRoles.includes(role)) {
    // Optional: Create an <Unauthorized /> page
    return <Navigate to={role === "teacher" ? "/teacher-dashboard" : role === "student" ? "/student-dashboard" : "/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;