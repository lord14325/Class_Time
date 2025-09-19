import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";
import "../styles/styles.css";

function Room() {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: "",
    room_name: "",
    room_type: "",
    capacity: "",
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const response = await fetch("http://localhost:5000/api/rooms");
    const data = await response.json();
    setRooms(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const url = editingRoom
      ? `http://localhost:5000/api/rooms/${editingRoom.id}`
      : "http://localhost:5000/api/rooms";
    const method = editingRoom ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_number: formData.room_number,
        room_name: formData.room_name,
        room_type: formData.room_type,
        capacity: parseInt(formData.capacity),
      }),
    });

    fetchRooms();
    setShowForm(false);
    setEditingRoom(null);
    setFormData({ room_number: "", room_name: "", room_type: "", capacity: "" });
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/api/rooms/${id}`, { method: 'DELETE' });
    fetchRooms();
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_name: room.room_name,
      room_type: room.room_type,
      capacity: room.capacity,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({ room_number: "", room_name: "", room_type: "", capacity: "" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({ room_number: "", room_name: "", room_type: "", capacity: "" });
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Room Management</h1>
          <button className="btn" onClick={handleAdd}>Add Room</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Room Name</th>
              <th>Room Type</th>
              <th>Capacity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.room_number}</td>
                <td>{room.room_name || 'N/A'}</td>
                <td>{room.room_type}</td>
                <td>{room.capacity}</td>
                <td>
                  <button className="edit" onClick={() => handleEdit(room)}>Edit</button> |
                  <button className="delete" onClick={() => handleDelete(room.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>{editingRoom ? "Edit Room" : "Add Room"}</h2>
              <form className="modal-form" onSubmit={handleSave}>
                <label>Room Number*</label>
                <input
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  required
                />

                <label>Room Name</label>
                <input
                  value={formData.room_name}
                  onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                />

                <label>Room Type*</label>
                <input
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  required
                />

                <label>Capacity*</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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

export default Room;