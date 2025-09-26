import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Course() {
  const [course, setCourse] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    description: "",
    subject: "",
    grade_level: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const response = await fetch("http://localhost:5000/api/courses");
    const data = await response.json();
    setCourse(data);
    setFilteredCourses(data);
  };

  useEffect(() => {
    let result = course;
    if (searchQuery) {
      result = result.filter((c) =>
        c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.course_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSubject) {
      result = result.filter(
        (c) => c.subject && c.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
    }
    if (selectedGrade) {
      result = result.filter(
        (c) => c.grade_level && c.grade_level.toLowerCase() === selectedGrade.toLowerCase()
      );
    }
    setFilteredCourses(result);
  }, [searchQuery, selectedSubject, selectedGrade, course]);

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingCourse
      ? `http://localhost:5000/api/courses/${editingCourse.id}`
      : "http://localhost:5000/api/courses";
    const method = editingCourse ? 'PUT' : 'POST';
    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    fetchCourses();
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ course_code: "", course_name: "", description: "", subject: "", grade_level: "" });
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' });
    fetchCourses();
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || '',
      subject: course.subject,
      grade_level: course.grade_level,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setFormData({ course_code: "", course_name: "", description: "", subject: "", grade_level: "" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ course_code: "", course_name: "", description: "", subject: "", grade_level: "" });
  };

  const uniqueSubjects = [...new Set(course.map((c) => c.subject).filter(Boolean))];
  const uniqueGrades = [...new Set(course.map((c) => c.grade_level).filter(Boolean))];

  return (
    <Layout>
      <div className="page-header">
        <h1>Course Management</h1>
        <button className="btn" onClick={handleAdd}>Add Course</button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by course name or code..."
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
          {uniqueSubjects.map((subject, idx) => (
            <option key={idx} value={subject}>
              {subject}
            </option>
          ))}
        </select>
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
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Subject</th>
            <th>Grade Level</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <tr key={course.id}>
                <td>{course.course_code}</td>
                <td>{course.course_name}</td>
                <td>{course.subject}</td>
                <td>{course.grade_level}</td>
                <td>
                  <button className="edit" onClick={() => handleEdit(course)}>Edit</button> |{" "}
                  <button className="delete" onClick={() => handleDelete(course.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No courses found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingCourse ? "Edit Course" : "Add Course"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Course Code*</label>
              <input
                placeholder="e.g., CS101, MATH201"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                required
              />

              <label>Course Name*</label>
              <input
                placeholder="Full course name"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                required
              />

              <label>Subject*</label>
              <input
                placeholder="e.g., Mathematics, Science"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />

              <label>Grade Level*</label>
              <input
                placeholder="e.g., Grade 9, Grade 10"
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                required
              />

              <label>Description</label>
              <textarea
                placeholder="Course description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              ></textarea>

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

export default Course;