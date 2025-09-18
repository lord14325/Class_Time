import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";

function Announcements() {
  const [announcement, setAnnouncement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_audience: "all"
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/announcements");
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      const data = await response.json();
      setAnnouncement(data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const handleAddAnnouncement = async (e) => {
    e.preventDefault();

    const announcementData = {
      title: formData.title,
      content: formData.content,
      target_audience: formData.target_audience,
      status: "published"
    };

    try {
      if (editingAnnouncement) {
        const response = await fetch(`http://localhost:5000/api/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(announcementData),
        });
        if (!response.ok) {
          throw new Error('Failed to update announcement');
        }
      } else {
        const response = await fetch("http://localhost:5000/api/announcements", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(announcementData),
        });
        if (!response.ok) {
          throw new Error('Failed to create announcement');
        }
      }

      fetchAnnouncements(); // Refresh the data
      setShowForm(false);
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", target_audience: "all" });
    } catch (err) {
      console.error("Error saving announcement:", err);
      setError(err.message);
    }
  };
  // Delete Announcement
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/announcements/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }
      fetchAnnouncements(); // Refresh the data
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError(err.message);
    }
  };

  // Edit Announcement
  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_audience: announcement.target_audience,
    });
    setShowForm(true);
  };
    // Open Add Announcement Modal
  const handleOpenAdd = () => {
    setEditingAnnouncement(null); // not editing
    setFormData({ title: "", content: "", target_audience: "all" }); // clear form
    setShowForm(true);
  };

  // Cancel Modal
  const handleCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "", target_audience: "all" }); // clear form
  };

  return (
    <Layout>
      <div className="page-header">
            <h1>Announcements</h1>
            <button className="btn" onClick={handleOpenAdd}>Add Announcement</button>
          </div>
          {/* Announcements Table */}
          {loading ? (
            <p>Loading announcements...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {announcement.map((ann) => (
                  <tr key={ann.id}>
                    <td>{ann.title}</td>
                    <td>{ann.content?.substring(0, 50)}...</td>
                    <td>{ann.target_audience}</td>
                    <td>
                      <span className={`status-badge ${ann.status === "published" ? "published" : ""}`}>
                        {ann.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>                 
                    <td>
                      <button className="edit" onClick={() => handleEdit(ann)}>Edit</button>{" "}
                      |{" "}
                      <button className="delete" onClick={() => handleDelete(ann.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        {/* Modal for Add Announcement */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>{editingAnnouncement ? "Edit Announcement" : "Add Announcement"}</h2>
                <form className= "modal-form" onSubmit={handleAddAnnouncement}>
                <label>Title*</label>
                  <input
                    name="title"
                    type="text"
                    placeholder="Short Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                <label>Content*</label>
                  <textarea
                    name="content"
                    placeholder="Write the announcement content here!"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  ></textarea>
                <label>Target Audience*</label>
                  <select
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  >
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                  </select>
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button> 
                  <button type="submit" className="btn">Publish</button>              
                </div>
              </form>
            </div>
          </div>
          )}
      </Layout>
    );
  }

export default Announcements;