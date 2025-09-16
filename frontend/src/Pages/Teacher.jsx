import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";

import "../styles/styles.css";

function Teacher() {
  const [teacher, setTeacher] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    employee_id: "",
    department: "",
    specialization: "",
    hire_date: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/teachers");
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const data = await response.json();
      setTeacher(data);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const url = editingTeacher 
        ? `http://localhost:5000/api/teachers/${editingTeacher.id}`
        : "http://localhost:5000/api/teachers";
      
      const method = editingTeacher ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save teacher');
      }

      const savedTeacher = await response.json();
      
      if (editingTeacher) {
        setTeacher(teacher.map((t) => 
          t.id === editingTeacher.id ? savedTeacher : t
        ));
      } else {
        setTeacher([...teacher, savedTeacher]);
      }

      setShowForm(false);
      setEditingTeacher(null);
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        employee_id: "",
        department: "",
        specialization: "",
        hire_date: "",
      });
    } catch (err) {
      console.error("Error saving teacher:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Delete Teacher
  const handleDelete = async (teacherId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teachers/${teacherId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }

      setTeacher(teacher.filter((t) => t.id !== teacherId));
    } catch (err) {
      console.error("Error deleting teacher:", err);
      setError(err.message);
    }
  };

  // Edit Teacher
  const handleEdit = (teacherToEdit) => {
    setEditingTeacher(teacherToEdit);
    setFormData({
      name: teacherToEdit.name,
      email: teacherToEdit.email,
      username: teacherToEdit.username,
      password: "",
      phone: teacherToEdit.phone || "",
      employee_id: teacherToEdit.employee_id || "",
      department: teacherToEdit.department || "",
      specialization: teacherToEdit.specialization || "",
      hire_date: teacherToEdit.hire_date ? teacherToEdit.hire_date.split('T')[0] : "",
    });
    setShowForm(true);
  };
    // Open Add Teacher Modal
  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      phone: "",
      employee_id: "",
      department: "",
      specialization: "",
      hire_date: "",
    });
    setShowForm(true);
  };

  // Cancel Modal
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
      department: "",
      specialization: "",
      hire_date: "",
    });
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Teacher Management</h1>
          <button className="btn" onClick={handleOpenAdd}>Add Teacher</button>
        </div>
        {/* Teacher's Table */}
        {loading ? (
          <p>Loading teachers...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                {/* <th>Specialization</th> */}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teacher.map((t) => (
                <tr key={t.id}>
                  <td>{t.employee_id}</td>
                  <td>{t.name}</td>
                  <td>{t.department}</td>
                  <td>{t.email}</td>
                  <td>{t.phone}</td>
                  {/* <td>{t.specialization}</td> */}
                <td>
                  <button className="edit" onClick={() => handleEdit(t)}>Edit</button>{" "}
                  |{" "}
                  <button className="delete" onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Modal for Add Teacher */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>
            <form className= "modal-form" onSubmit={handleAddTeacher}>
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
                  <label>Department*</label>
                  <input
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                  <label>Specialization*</label>
                  <input
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </div>
                {!editingTeacher && (
                  <div className="form-group">
                    <label>Hire Date*</label>
                    <input
                      name="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>                
                <button type="submit" className="btn" onClick={handleAddTeacher}>Save</button>
              </div>
            </form>
          </div>
        </div>
        )}
      </Layout>
  );
}


export default Teacher;