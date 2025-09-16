import React, { useState } from "react";
import Layout from "../component/Layout";

import "../styles/styles.css";

function Schedule() {
  const [schedule, setSchedule] = useState([
    { id: 1, semester: "Fall", year: "2025", grade: "Grade 10", section: "A", day: "Monday", timeslot: "9:00-10:00", course: "Math 101", teacher: "Mr. Smith", room: "R101"}
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    semester: "",
    year: "",
    grade: "",
    section: "",
    day: "",
    timeslot: "",
    course: "",
    teacher: "",
    room: "",
  });

  const handleAddSchedule = (e) => {
    e.preventDefault();

    const scheduleData = {
      id: editingSchedule ? editingSchedule.id : Date.now(),
      semester: formData.semester,
      year: formData.year,
      grade: formData.grade,
      section: formData.section,
      day: formData.day,
      timeslot: formData.timeslot,
      course: formData.course,
      teacher: formData.teacher,
      room: formData.room,
    };

    if (editingSchedule) {
      const updatedSchedule = schedule.map((r) =>
        r.id === editingSchedule.id ? scheduleData : r
      );
      setSchedule(updatedSchedule);
    } else {
      setSchedule([...schedule, scheduleData]);
    }

    setShowForm(false);
    setEditingSchedule(null);
    setFormData({ semester: "", year: "", grade: "", section: "", day: "" , timeslot: "", course: "", teacher: "", room: "" }); // reset form
  };
  // Delete Schedule
  const handleDelete = (id) => {
    const updatedSchedule = schedule.filter((schedule) => schedule.id !== id);
    setSchedule(updatedSchedule);
  };

  // Edit Schedule
  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      semester: schedule.semester,
      year: schedule.year,
      grade: schedule.grade,
      section: schedule.section,
      day: schedule.day,
      timeslot: schedule.timeslot,
      course: schedule.course,
      teacher: schedule.teacher,
      room: schedule.room,
    });
    setShowForm(true);
  };
    // Open Add Schedule Modal
  const handleOpenAdd = () => {
    setEditingSchedule(null); // not editing
    setFormData({ semester: "", year: "", grade: "", section: "", day: "" , timeslot: "", course: "", teacher: "", room: ""}); // clear form
    setShowForm(true);
  };
  // Open View Schedule page

  // Cancel Modal
  const handleCancel = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({ semester: "", year: "", grade: "", section: "", day: "" , timeslot: "", course: "", teacher: "", room: ""}); // clear form
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Schedule Management</h1>
          <button className="btn" onClick={handleOpenAdd}>Add Schedule</button>
          <button className="btn" onClick={handleOpenAdd}>View Schedule</button>
        </div>
        {/* Schedule Table */}
        <table className="data-table">
          <thead>
            <tr>
              {/* <th>Semester</th>
              <th>Year</th>
              <th>Grade</th>
              <th>Section</th> */}
              <th>Day</th>
              <th>Timeslot</th>
              <th>Course</th>
              <th>Teacher</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((schedule) => (
              <tr key={schedule.id}>
                {/* <td>{schedule.semester}</td>
                <td>{schedule.year}</td>
                <td>{schedule.grade}</td>
                <td>{schedule.section}</td> */}
                <td>{schedule.day}</td>
                <td>{schedule.timeslot}</td>
                <td>{schedule.course}</td>
                <td>{schedule.teacher}</td>
                <td>{schedule.room}</td>

              </tr>
            ))}
          </tbody>
        </table>
        {/* Modal for Add Schedule */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingSchedule ? "Edit Schedule" : "Add Schedule"}</h2>
            <form className= "modal-form" onSubmit={handleAddSchedule}>
              <label>Semester</label>
                <input
                  name="fullname"
                  type= "text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  required
                />

                <label>Subject*</label>
                <input
                  name="subject"
                  type= "text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />

                <label>Email*</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <label>Username*</label>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <div className="form-grid">
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                    name="semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="Spring">Spring</option>
                      <option value="Fall">Fall</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <select
                    name="year"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grade</label>
                    <select
                    name="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>

                    </select>
                  </div>   
                </div>
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>                
                <button type="submit" className="btn" onClick={handleAddSchedule}>Save</button>
              </div>
            </form>
          </div>
        </div>
        )}
      </Layout>
  );
}


export default Schedule;