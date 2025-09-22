import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Student() {
  const [student, setStudent] = useState([]);
  const [rooms, setRooms] = useState([]);
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

  useEffect(() => {
    fetchStudents();
    fetchRooms();
  }, []);

  const fetchStudents = async () => {
    const response = await fetch("http://localhost:5000/api/students");
    const data = await response.json();
    setStudent(data);
  };

  const fetchRooms = async () => {
    const response = await fetch("http://localhost:5000/api/rooms");
    const data = await response.json();
    setRooms(data);
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
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "", room_id: "", section: "" });
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
      room_id: student.room_id || '',
      section: student.section || '',
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "", room_id: "", section: "" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: "", email: "", username: "", password: "", student_id: "", grade_level: "", phone: "", address: "", enrollment_date: "", room_id: "", section: "" });
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
            {student.map((student) => (
              <tr key={student.student_id}>
                <td>{student.student_id}</td>
                <td>{student.name}</td>
                <td>{student.grade_level}</td>
                <td>{student.section || 'Not Assigned'}</td>
                <td>{student.room_number || 'Not Assigned'}</td>
                <td>{student.email}</td>
                <td>{student.phone}</td>
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
                <div className="form-group">
                  <label>Room</label>
                  <select
                    name="room_id"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  >
                    <option value="">Select Room</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.room_number} - {room.room_name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
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