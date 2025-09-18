import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";


function Course() {
  const [course, setCourse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    description: "",
    subject: "",
    grade_level: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/courses");
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();

    const courseData = {
      course_code: formData.course_code,
      course_name: formData.course_name,
      description: formData.description,
      subject: formData.subject,
      grade_level: formData.grade_level,
    };

    try {
      if (editingCourse) {
        const response = await fetch(`http://localhost:5000/api/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(courseData),
        });
        if (!response.ok) {
          throw new Error('Failed to update course');
        }
      } else {
        const response = await fetch("http://localhost:5000/api/courses", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(courseData),
        });
        if (!response.ok) {
          throw new Error('Failed to create course');
        }
      }

      fetchCourses(); // Refresh the data
      setShowForm(false);
      setEditingCourse(null);
      setFormData({ course_code: "", course_name: "", description: "", subject: "", grade_level: "" });
    } catch (err) {
      console.error("Error saving course:", err);
      setError(err.message);
    }
  };
  // Delete Course
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      fetchCourses(); // Refresh the data
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(err.message);
    }
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

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({ course_code: "", course_name: "", description: "", subject: "", grade_level: "" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ course_code: "", course_name: "", description: "", subject: "", grade_level: "" }); // clear form
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Course Management</h1>
          <button className="btn" onClick={handleOpenAdd}>Add Course</button>
        </div>
        {/* Courses Table */}
        {loading ? (
          <p>Loading courses...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
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
            {course.map((course) => (
              <tr key={course.id}>
                <td>{course.course_code}</td>
                <td>{course.course_name}</td>
                <td>{course.subject}</td>
                <td>{course.grade_level}</td>
              <td>
                <button className="edit" onClick={() => handleEdit(course)}>Edit</button>{" "}
                |{" "}
                <button className="delete" onClick={() => handleDelete(course.id)}>Delete</button>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {/* Modal for Add Course */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingCourse ? "Edit Course" : "Add Course"}</h2>
            <form className= "modal-form" onSubmit={handleAddCourse}>
              <label>Course Code*</label>
                <input
                  name="course_code"
                  type="text"
                  placeholder="e.g., CS101, MATH201"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  required
                />
              <label>Course Name*</label>
                <input
                  name="course_name"
                  type="text"
                  placeholder="Full course name"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  required
                />

                <label>Subject*</label>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g., Mathematics, Science"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />

                <label>Grade Level*</label>
                <input
                  name="grade_level"
                  type="text"
                  placeholder="e.g., Grade 9, Grade 10"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  required
                />

                <label>Description</label>
                <textarea
                  name="description"
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