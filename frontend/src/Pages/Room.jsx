import React, { useState, useEffect } from "react";
import Layout from "../component/Layout";

import "../styles/styles.css";

function Room() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/rooms");
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();

    const roomData = {
      room_number: formData.room_number,
      room_name: formData.room_name,
      room_type: formData.room_type,
      capacity: parseInt(formData.capacity),
    };

    try {
      if (editingRoom) {
        const response = await fetch(`http://localhost:5000/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roomData),
        });
        if (!response.ok) {
          throw new Error('Failed to update room');
        }
      } else {
        const response = await fetch("http://localhost:5000/api/rooms", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roomData),
        });
        if (!response.ok) {
          throw new Error('Failed to create room');
        }
      }

      fetchRooms(); // Refresh the data
      setShowForm(false);
      setEditingRoom(null);
      setFormData({ room_number: "", room_name: "", room_type: "", capacity: "" });
    } catch (err) {
      console.error("Error saving room:", err);
      setError(err.message);
    }
  };
  // Delete Room
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete room');
      }
      fetchRooms(); // Refresh the data
    } catch (err) {
      console.error("Error deleting room:", err);
      setError(err.message);
    }
  };

  // Edit Room
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
    // Open Add Room Modal
  const handleOpenAdd = () => {
    setEditingRoom(null); // not editing
    setFormData({ room_number: "", room_name: "", room_type: "", capacity: "" }); // clear form
    setShowForm(true);
  };

  // Cancel Modal
  const handleCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({ room_number: "", room_name: "", room_type: "", capacity: "" }); // clear form
  };

  return (
  <Layout>
        <div className="page-header">
          <h1>Room Management</h1>
          <button className="btn" onClick={handleOpenAdd}>Add Room</button>
        </div>
        {/* Rooms Table */}
        {loading ? (
          <p>Loading rooms...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
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
                <button className="edit" onClick={() => handleEdit(room)}>Edit</button>{" "}
                |{" "}
                <button className="delete" onClick={() => handleDelete(room.id)}>Delete</button>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {/* Modal for Add Room */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            {/* <h2>Add Room</h2> */}
            <h2>{editingRoom ? "Edit Room" : "Add Room"}</h2>
            <form className= "modal-form" onSubmit={handleAddRoom}>
              <label>Room Number*</label>
                <input
                  name="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  required
                />

              <label>Room Name</label>
                <input
                  name="room_name"
                  value={formData.room_name}
                  onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                />

              <label>Room Type*</label>
                <input
                  name="room_type"
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  required
                />

              <label>Capacity*</label>
                <input
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>                
                <button type="submit" className="btn" onClick={handleAddRoom}>Save</button>
              </div>
            </form>
          </div>
        </div>
        )}
      </Layout>
  );
}

export default Room;