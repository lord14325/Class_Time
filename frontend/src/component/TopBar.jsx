import React from "react";
import { useState } from "react";
import LOGO2 from "../assets/Logo2.png";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


import "../styles/TopBar.css";

  function Topbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    
    const handleLogout = () => {
  
    navigate("/"); 
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={LOGO2} alt="ClassTime Logo" className="topbar-logo" />
        <h1 className="topbar-title">ClassTime</h1>
      </div>
      <div className="topbar-right">
        <div
          className="profile-container"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FaUserCircle className="profile-icon" />
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
