import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Student() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    student_id: "",
    grade_level: "",
    phone: "",
    address: "",
    enrollment_date: "",
    room_id: "",
    section: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchRooms();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/students");
      const data = await response.json();

      let studentList = [];
      if (Array.isArray(data)) {
        studentList = data;
      } else if (Array.isArray(data.students)) {
        studentList = data.students;
      }
      setStudents(studentList);
      setFilteredStudents(studentList);
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms");
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    }
  };

  useEffect(() => {
    let result = students;
    if (searchQuery) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedGrade) {
      result = result.filter(
        (s) =>
          s.grade_level &&
          s.grade_level.toLowerCase() === selectedGrade.toLowerCase()
      );
    }
    setFilteredStudents(result);
  }, [searchQuery, selectedGrade, students]);

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingStudent
      ? `http://localhost:5000/api/students/${editingStudent.id}`
      : "http://localhost:5000/api/students";
    const method = editingStudent ? "PUT" : "POST";

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      fetchStudents();
      setShowForm(false);
      setEditingStudent(null);
      resetForm();
    } catch (err) {
      console.error("Error saving student:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/students/${id}`, {
        method: "DELETE",
      });
      fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      username: student.username || "",
      password: "",
      student_id: student.student_id,
      grade_level: student.grade_level,
      phone: student.phone,
      address: student.address,
      enrollment_date: student.enrollment_date
        ? student.enrollment_date.split("T")[0]
        : "",
      room_id: student.room_id || "",
      section: student.section || "",
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      student_id: "",
      grade_level: "",
      phone: "",
      address: "",
      enrollment_date: "",
      room_id: "",
      section: "",
    });
  };

  const uniqueGrades = [
    ...new Set(students.map((s) => s.grade_level).filter(Boolean)),
  ];

  return (
    <Layout>
      <div className="page-header">
        <h1>Student Management</h1>
        <button className="btn" onClick={handleAdd}>
          Add Student
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="filter-dropdown"
        >
          <option value="">All Grades</option>
          {uniqueGrades.map((grade, idx) => (
            <option key={idx} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Grade Level</th>
            <th>Section</th>
            <th>Room</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Enrollment Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="9">Loading students...</td>
            </tr>
          ) : filteredStudents.length === 0 ? (
            <tr>
              <td colSpan="9">No students found</td>
            </tr>
          ) : (
            filteredStudents.map((student) => (
              <tr key={student.student_id}>
                <td>{student.student_id}</td>
                <td>{student.name}</td>
                <td>{student.grade_level}</td>
                <td>{student.section || "Not Assigned"}</td>
                <td>{student.room_number || "Not Assigned"}</td>
                <td>{student.email}</td>
                <td>{student.phone}</td>
                <td>
                  {student.enrollment_date
                    ? new Date(student.enrollment_date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <button className="edit" onClick={() => handleEdit(student)}>
                    Edit
                  </button>{" "}
                  |{" "}
                  <button
                    className="delete"
                    onClick={() => handleDelete(student.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingStudent ? "Edit Student" : "Add Student"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Name*</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <label>Email*</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <label>Student ID*</label>
              <input
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
              />
              <label>Grade Level*</label>
              <input
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                required
              />
              <label>Section</label>
              <input
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
              <label>Room</label>
              <select
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.room_number} - {room.room_name}
                  </option>
                ))}
              </select>
              <label>Phone</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <label>Address</label>
              <input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <label>Enrollment Date</label>
              <input
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
              />
              {!editingStudent && (
                <>
                  <label>Username*</label>
                  <input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                  <label>Password*</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>
                <button type="submit" className="btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Student;
