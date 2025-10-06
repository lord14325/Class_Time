import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";

function Announcements() {
  const role = localStorage.getItem("role");
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
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
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const data = await response.json();

      let filteredData = data;
      if (role === "student") {
        filteredData = data.filter(
          (ann) =>
            ann.target_audience === "all" || ann.target_audience === "students"
        );
      } else if (role === "teacher") {
        filteredData = data.filter(
          (ann) =>
            ann.target_audience === "all" || ann.target_audience === "teachers"
        );
      }

      setAnnouncements(data);
      setFilteredAnnouncements(filteredData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "admin") return;
    let result = announcements;
    if (searchQuery) {
      result = result.filter((ann) =>
        ann.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedAudience) {
      result = result.filter((ann) => ann.target_audience === selectedAudience);
    }
    setFilteredAnnouncements(result);
  }, [searchQuery, selectedAudience, announcements, role]);

  const handleAddAnnouncement = async (e) => {
    if (role !== "admin") return;
    e.preventDefault();

    const announcementData = {
      title: formData.title,
      content: formData.content,
      target_audience: formData.target_audience,
      status: "published",
    };

    try {
      const url = editingAnnouncement
        ? `http://localhost:5000/api/announcements/${editingAnnouncement.id}`
        : "http://localhost:5000/api/announcements";

      const method = editingAnnouncement ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok)
        throw new Error(method === "PUT" ? "Failed to update" : "Failed to create");

      fetchAnnouncements();
      setShowForm(false);
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", target_audience: "all" });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (role !== "admin") return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/announcements/${id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");
      fetchAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (announcement) => {
    if (role !== "admin") return;
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_audience: announcement.target_audience,
    });
    setShowForm(true);
  };

  const handleOpenAdd = () => {
    if (role !== "admin") return;
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "", target_audience: "all" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "", target_audience: "all" });
  };

  const audienceOptions = ["all", "students", "teachers"];

  const renderTable = () => {
    return (
      <div className="table-container">
        {role === "admin" && (
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">All Audiences</option>
              {audienceOptions.map((aud) => (
                <option key={aud} value={aud}>
                  {aud.charAt(0).toUpperCase() + aud.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Content</th>
              <th>Target</th>
              <th>Status</th>
              {role === "admin" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={role === "admin" ? "5" : "4"}>Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={role === "admin" ? "5" : "4"} className="error">
                  Error: {error}
                </td>
              </tr>
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((ann) => (
                <tr key={ann.id}>
                  <td>{ann.title}</td>
                  <td>{ann.content?.substring(0, 50)}...</td>
                  <td>{ann.target_audience}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        ann.status === "published" ? "published" : ""
                      }`}
                    >
                      {ann.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  {role === "admin" && (
                    <td>
                      <button className="edit" onClick={() => handleEdit(ann)}>
                        Edit
                      </button>{" "}
                      |{" "}
                      <button
                        className="delete"
                        onClick={() => handleDelete(ann.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={role === "admin" ? "5" : "4"} style={{ textAlign: "center" }}>
                  No announcements found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModal = () => {
    if (role !== "admin" || !showForm) return null;

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>{editingAnnouncement ? "Edit Announcement" : "Add Announcement"}</h2>
          <form onSubmit={handleAddAnnouncement}>
            <label>Title*</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <label>Content*</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            ></textarea>
            <label>Target Audience*</label>
            <select
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            >
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
            </select>
            <div className="modal-actions">
              <button type="button" onClick={handleCancel}>Cancel</button>
              <button type="submit">Publish</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Announcements</h1>
        {role === "admin" && (
          <button className="btn" onClick={handleOpenAdd}>
            Add Announcement
          </button>
        )}
      </div>

      {renderTable()}
      {renderModal()}
    </Layout>
  );
}

export default Announcements;
