import React, { useEffect, useState } from "react";
import Layout from "../component/Layout";
import "../styles/Schedule.css";

function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [formData, setFormData] = useState({
    class_section_id: "",
    room_id: "",
    day_of_week: "",
    start_time: "",
    end_time: ""
  });

  const [filters, setFilters] = useState({
    semester: "",
    academic_year: "",
    section_name: "",
    day_of_week: ""
  });

  const daysOfWeek = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" }
  ];

  const getDayName = (dayNumber) => {
    return daysOfWeek.find(day => day.value === dayNumber)?.label || "Unknown";
  };

  useEffect(() => {
    fetchSchedules();
    fetchClassSections();
    fetchRooms();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/schedules");
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSections = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/class-sections");
      if (response.ok) {
        const data = await response.json();
        setClassSections(data);
      }
    } catch (err) {
      console.error("Error fetching class sections:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
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
        ? `http://localhost:5000/api/schedules/filter?${queryParams}`
        : "http://localhost:5000/api/schedules";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch filtered schedules');
      }
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      console.error("Error filtering schedules:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      semester: "",
      academic_year: "",
      section_name: "",
      day_of_week: ""
    });
    fetchSchedules();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSchedule
        ? `http://localhost:5000/api/schedules/${editingSchedule.id}`
        : "http://localhost:5000/api/schedules";

      const method = editingSchedule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          class_section_id: parseInt(formData.class_section_id),
          room_id: formData.room_id ? parseInt(formData.room_id) : null,
          day_of_week: parseInt(formData.day_of_week)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save schedule');
      }

      resetForm();
      fetchSchedules();
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(err.message);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      class_section_id: schedule.class_section_id?.toString() || "",
      room_id: schedule.room_id?.toString() || "",
      day_of_week: schedule.day_of_week?.toString() || "",
      start_time: schedule.start_time || "",
      end_time: schedule.end_time || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/schedules/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      fetchSchedules();
    } catch (err) {
      console.error("Error deleting schedule:", err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      class_section_id: "",
      room_id: "",
      day_of_week: "",
      start_time: "",
      end_time: ""
    });
    setEditingSchedule(null);
    setShowForm(false);
    setError(null);
  };

  return (
    <Layout>
      <div className="schedule-container">
        <div className="schedule-header">
          <h1>Class Schedule Management</h1>
          <div className="header-actions">
            <a href="/class-sections" className="btn btn-outline">
              Manage Class Sections
            </a>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "Add Schedule"}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Filters Section */}
        <div className="filters-section">
          <h3>Filter Schedules</h3>
          <div className="filters-grid">
            <input
              type="text"
              name="semester"
              placeholder="Semester"
              value={filters.semester}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="academic_year"
              placeholder="Academic Year"
              value={filters.academic_year}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="section_name"
              placeholder="Section Name"
              value={filters.section_name}
              onChange={handleFilterChange}
            />
            <select
              name="day_of_week"
              value={filters.day_of_week}
              onChange={handleFilterChange}
            >
              <option value="">All Days</option>
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
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
            <h3>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</h3>
            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Class Section *</label>
                  <select
                    name="class_section_id"
                    value={formData.class_section_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Class Section</option>
                    {classSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.course_code} - {section.section_name}
                        ({section.semester} {section.academic_year})
                        {section.teacher_name && ` - ${section.teacher_name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Room</label>
                  <select
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Room (Optional)</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.room_number} - {room.room_name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Day of Week *</label>
                  <select
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSchedule ? "Update Schedule" : "Create Schedule"}
                </button>
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule List */}
        <div className="schedule-list">
          <h3>Current Schedules</h3>
          {loading ? (
            <p>Loading schedules...</p>
          ) : schedules.length === 0 ? (
            <p>No schedules found.</p>
          ) : (
            <div className="schedule-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Teacher</th>
                    <th>Room</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(schedule => (
                    <tr key={schedule.id}>
                      <td>
                        <div className="course-info">
                          <strong>{schedule.course_code}</strong>
                          <br />
                          <small>{schedule.course_name}</small>
                        </div>
                      </td>
                      <td>{schedule.section_name}</td>
                      <td>{schedule.teacher_name || "Not assigned"}</td>
                      <td>
                        {schedule.room_number
                          ? `${schedule.room_number} - ${schedule.room_name}`
                          : "Not assigned"
                        }
                      </td>
                      <td>{getDayName(schedule.day_of_week)}</td>
                      <td>
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td>
                        {schedule.semester} {schedule.academic_year}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEdit(schedule)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(schedule.id)}
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

export default Schedule;