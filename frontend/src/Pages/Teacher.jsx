import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Teacher() {
  const [teacher, setTeacher] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    employee_id: "",
    subject: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const response = await fetch("http://localhost:5000/api/teachers");
    const data = await response.json();
    setTeacher(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const url = editingTeacher
      ? `http://localhost:5000/api/teachers/${editingTeacher.id}`
      : "http://localhost:5000/api/teachers";
    const method = editingTeacher ? "PUT" : "POST";

    await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    fetchTeachers();
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({ name: "", email: "", username: "", password: "", phone: "", employee_id: "", subject: "" });
  };

  const handleDelete = async (teacherId) => {
    await fetch(`http://localhost:5000/api/teachers/${teacherId}`, { method: "DELETE" });
    fetchTeachers();
  };

  const handleEdit = (teacherToEdit) => {
    setEditingTeacher(teacherToEdit);
    setFormData({
      name: teacherToEdit.name,
      email: teacherToEdit.email,
      username: teacherToEdit.username,
      password: "",
      phone: teacherToEdit.phone || "",
      employee_id: teacherToEdit.employee_id || "",
      subject: teacherToEdit.subject || "",
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData({ name: "", email: "", username: "", password: "", phone: "", employee_id: "", subject: "" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({ name: "", email: "", username: "", password: "", phone: "", employee_id: "", subject: "" });
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Teacher Management</h1>
          <button className="btn" onClick={handleAdd}>Add Teacher</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teacher.map((t) => (
              <tr key={t.id}>
                <td>{t.employee_id}</td>
                <td>{t.name}</td>
                <td>{t.subject}</td>
                <td>{t.email}</td>
                <td>{t.phone}</td>
                <td>
                  <button className="edit" onClick={() => handleEdit(t)}>Edit</button> |
                  <button className="delete" onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>
            <form className= "modal-form" onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name*</label>
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
                {!editingTeacher && (
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
                  <label>Employee ID*</label>
                  <input
                    name="employee_id"
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
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
                  <label>Subject*</label>
                  <input
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
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


export default Teacher;