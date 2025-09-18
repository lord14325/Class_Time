import React, { useEffect, useState } from "react";
import Layout from "../component/Layout";
import "../styles/ClassSections.css";

function ClassSections() {
  const [classSections, setClassSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [formData, setFormData] = useState({
    course_id: "",
    teacher_id: "",
    section_name: "",
    semester: "",
    academic_year: "",
    max_students: 30
  });

  const [filters, setFilters] = useState({
    course_id: "",
    teacher_id: "",
    semester: "",
    academic_year: "",
    department: ""
  });

  useEffect(() => {
    fetchClassSections();
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchClassSections = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/class-sections");
      if (!response.ok) {
        throw new Error('Failed to fetch class sections');
      }
      const data = await response.json();
      setClassSections(data);
    } catch (err) {
      console.error("Error fetching class sections:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const url = queryParams.toString()
        ? `http://localhost:5000/api/class-sections/filter?${queryParams}`
        : "http://localhost:5000/api/class-sections";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch filtered class sections');
      }
      const data = await response.json();
      setClassSections(data);
    } catch (err) {
      console.error("Error filtering class sections:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      course_id: "",
      teacher_id: "",
      semester: "",
      academic_year: "",
      department: ""
    });
    fetchClassSections();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSection
        ? `http://localhost:5000/api/class-sections/${editingSection.id}`
        : "http://localhost:5000/api/class-sections";

      const method = editingSection ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          course_id: parseInt(formData.course_id),
          teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
          max_students: parseInt(formData.max_students)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save class section');
      }

      resetForm();
      fetchClassSections();
    } catch (err) {
      console.error("Error saving class section:", err);
      setError(err.message);
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      course_id: section.course_id?.toString() || "",
      teacher_id: section.teacher_id?.toString() || "",
      section_name: section.section_name || "",
      semester: section.semester || "",
      academic_year: section.academic_year || "",
      max_students: section.max_students || 30
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class section? This will also affect any related schedules.")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/class-sections/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete class section');
      }

      fetchClassSections();
    } catch (err) {
      console.error("Error deleting class section:", err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      teacher_id: "",
      section_name: "",
      semester: "",
      academic_year: "",
      max_students: 30
    });
    setEditingSection(null);
    setShowForm(false);
    setError(null);
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (key) => {
    const values = classSections.map(section => section[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const getUniqueDepartments = () => {
    const departments = courses.map(course => course.department).filter(Boolean);
    return [...new Set(departments)].sort();
  };

  return (
    <Layout>
      <div className="class-sections-container">
        <div className="class-sections-header">
          <h1>Class Sections Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Add Class Section"}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Filters Section */}
        <div className="filters-section">
          <h3>Filter Class Sections</h3>
          <div className="filters-grid">
            <select
              name="course_id"
              value={filters.course_id}
              onChange={handleFilterChange}
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>

            <select
              name="teacher_id"
              value={filters.teacher_id}
              onChange={handleFilterChange}
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.employee_id})
                </option>
              ))}
            </select>

            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="semester"
              placeholder="Semester (e.g., Fall, Spring)"
              value={filters.semester}
              onChange={handleFilterChange}
            />

            <input
              type="text"
              name="academic_year"
              placeholder="Academic Year (e.g., 2024-2025)"
              value={filters.academic_year}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filters-actions">
            <button className="btn btn-secondary" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="btn btn-outline" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="form-section">
            <h3>{editingSection ? "Edit Class Section" : "Add New Class Section"}</h3>
            <form onSubmit={handleSubmit} className="class-section-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                        ({course.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Teacher</label>
                  <select
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Teacher (Optional)</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.employee_id}) - {teacher.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Section Name *</label>
                  <input
                    type="text"
                    name="section_name"
                    value={formData.section_name}
                    onChange={handleInputChange}
                    placeholder="e.g., A, B, Section-1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Semester *</label>
                  <input
                    type="text"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder="e.g., Fall, Spring, Summer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Academic Year *</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Max Students</label>
                  <input
                    type="number"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSection ? "Update Class Section" : "Create Class Section"}
                </button>
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Class Sections List */}
        <div className="class-sections-list">
          <h3>Current Class Sections</h3>
          {loading ? (
            <p>Loading class sections...</p>
          ) : classSections.length === 0 ? (
            <p>No class sections found. Create one to get started!</p>
          ) : (
            <div className="class-sections-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Teacher</th>
                    <th>Semester</th>
                    <th>Academic Year</th>
                    <th>Max Students</th>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classSections.map(section => (
                    <tr key={section.id}>
                      <td>
                        <div className="course-info">
                          <strong>{section.course_code}</strong>
                          <br />
                          <small>{section.course_name}</small>
                        </div>
                      </td>
                      <td>{section.section_name}</td>
                      <td>
                        {section.teacher_name
                          ? `${section.teacher_name} (${section.employee_id})`
                          : "Not assigned"
                        }
                      </td>
                      <td>{section.semester}</td>
                      <td>{section.academic_year}</td>
                      <td>{section.max_students}</td>
                      <td>{section.department}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEdit(section)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(section.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ClassSections;