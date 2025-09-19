import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Student() {
  const [student, setStudent] = useState([]);
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
    const response = await fetch("http://localhost:5000/api/students");
    const data = await response.json();
    setStudent(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const url = editingStudent
      ? `http://localhost:5000/api/students/${editingStudent.id}`
      : "http://localhost:5000/api/students";
    const method = editingStudent ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    fetchStudents();
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "" });
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/api/students/${id}`, { method: 'DELETE' });
    fetchStudents();
  };

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

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "" });
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Student Management</h1>
          <button className="btn" onClick={handleAdd}>Add Student</button>
        </div>

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
                  <button className="edit" onClick={() => handleEdit(student)}>Edit</button> |
                  <button className="delete" onClick={() => handleDelete(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Modal for Add Student */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingStudent ? "Edit Student" : "Add Student"}</h2>
            <form className= "modal-form" onSubmit={handleSave}>
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