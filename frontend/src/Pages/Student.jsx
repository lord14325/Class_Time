import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";

import "../styles/styles.css";

function Student() {
  const [student, setStudent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/students");
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudent(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const studentData = {
      name: formData.name,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      student_id: formData.student_id,
      grade_level: formData.grade_level,
      phone: formData.phone,
      address: formData.address,
      enrollment_date: formData.enrollment_date,
    };

    try {
      if (editingStudent) {
        const response = await fetch(`http://localhost:5000/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        });
        if (!response.ok) {
          throw new Error('Failed to update student');
        }
      } else {
        const response = await fetch("http://localhost:5000/api/students", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        });
        if (!response.ok) {
          throw new Error('Failed to create student');
        }
      }

      fetchStudents(); // Refresh the data
      setShowForm(false);
      setEditingStudent(null);
      setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "" });
    } catch (err) {
      console.error("Error saving student:", err);
      setError(err.message);
    }
  };
  // Delete Student
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
      fetchStudents(); // Refresh the data
    } catch (err) {
      console.error("Error deleting student:", err);
      setError(err.message);
    }
  };

  // Edit Student
  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      username: student.username || '',
      password: '',
      student_id: student.student_id,
      grade_level: student.grade_level,
      phone: student.phone,
      address: student.address,
      enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : '',
    });
    setShowForm(true);
  };
    // Open Add Student Modal
  const handleOpenAdd = () => {
    setEditingStudent(null); // not editing
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "" }); // clear form
    setShowForm(true);
  };

  // Cancel Modal
  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "" }); // clear form
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Student Management</h1>
          <button className="btn" onClick={handleOpenAdd}>Add Student</button>
        </div>
        {/* Student's's Table */}
        {loading ? (
          <p>Loading students...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Grade Level</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Name</th>
              <th>Enrollment Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {student.map((student) => (
              <tr key={student.student_id}>
                <td>{student.student_id}</td>
                <td>{student.grade_level}</td>
                <td>{student.email}</td>
                <td>{student.phone}</td>
                <td>{student.name}</td>
                <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
              <td>
                <button className="edit" onClick={() => handleEdit(student)}>Edit</button>{" "}
                <button className="delete" onClick={() => handleDelete(student.id)}>Delete</button>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {/* Modal for Add Student */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingStudent ? "Edit Student" : "Add Student"}</h2>
            <form className= "modal-form" onSubmit={handleAddStudent}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Student Name*</label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email*</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {!editingStudent && (
                  <>
                    <div className="form-group">
                      <label>Username*</label>
                      <input
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Password*</label>
                      <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label>Student ID*</label>
                  <input
                    name="student_id"
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Grade Level*</label>
                  <input
                    name="grade_level"
                    type="text"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone*</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address*</label>
                  <input
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                {!editingStudent && (
                  <div className="form-group">
                    <label>Enrollment Date*</label>
                    <input
                      name="enrollment_date"
                      type="date"
                      value={formData.enrollment_date}
                      onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>                
                  <button type="submit" className="btn" onClick={handleAddStudent}>Save</button>
                </div>
            </form>
          </div>
        </div>
        )}
      </Layout>
  );
}


export default Student;