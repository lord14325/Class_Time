import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Teacher() {
  const [teacher, setTeacher] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const response = await fetch("http://localhost:5000/api/teachers");
    const data = await response.json();
    setTeacher(data);
    setFilteredTeachers(data);
  };

  useEffect(() => {
    let result = teacher;
    if (searchQuery) {
      result = result.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSubject) {
      result = result.filter(
        (t) => t.subject && t.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
    }
    setFilteredTeachers(result);
  }, [searchQuery, selectedSubject, teacher]);

  const handleSave = async (e) => {
    e.preventDefault();

    const url = editingTeacher
      ? `http://localhost:5000/api/teachers/${editingTeacher.id}`
      : "http://localhost:5000/api/teachers";
    const method = editingTeacher ? "PUT" : "POST";

    await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    fetchTeachers();
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
      employee_id: "",
      subject: "",
    });
  };

  const handleDelete = async (teacherId) => {
    await fetch(`http://localhost:5000/api/teachers/${teacherId}`, {
      method: "DELETE",
    });
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
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
      employee_id: "",
      subject: "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
      employee_id: "",
      subject: "",
    });
  };

  const uniqueSubjects = [...new Set(teacher.map((t) => t.subject).filter(Boolean))];

  return (
    <Layout>
      <div className="page-header">
        <h1>Teacher Management</h1>
        <button className="btn" onClick={handleAdd}>
          Add Teacher
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
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="filter-dropdown"
        >
          <option value="">All Subjects</option>
          {uniqueSubjects.map((subj, idx) => (
            <option key={idx} value={subj}>
              {subj}
            </option>
          ))}
        </select>
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
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((t) => (
              <tr key={t.id}>
                <td>{t.employee_id}</td>
                <td>{t.name}</td>
                <td>{t.subject}</td>
                <td>{t.email}</td>
                <td>{t.phone}</td>
                <td>
                  <button className="edit" onClick={() => handleEdit(t)}>
                    Edit
                  </button>{" "}
                  |{" "}
                  <button className="delete" onClick={() => handleDelete(t.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No teachers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Full Name*</label>
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
              {!editingTeacher && (
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
              <label>Employee ID*</label>
              <input
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
              />
              <label>Phone*</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <label>Subject*</label>
              <input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
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
