import React from "react";
import { RiAdminFill } from "react-icons/ri"; // Admin icon
import { FaChalkboardTeacher } from "react-icons/fa"; // Teacher icon
import { PiStudentBold } from "react-icons/pi"; // Student icon
import LOGO2 from "../assets/Logo2.png";

import { useNavigate } from "react-router-dom";

import "../styles/UserSelection.css";

function UserSelection() {
    const navigate = useNavigate(); 

    const handleRoleClick = (role) => {
        navigate(`/login?role=${role}`);
    };


    const roles = [
        { key: 'Admin', label: 'Admin', Icon: RiAdminFill },
        { key: 'Teacher', label: 'Teacher', Icon: FaChalkboardTeacher },
        { key: 'Student', label: 'Student', Icon: PiStudentBold },
    ];

  return (
    <section className="container">
        <div className="container-top">
            <img src={LOGO2} alt="web app logo" className="icon-calendar"/>
            <h1 className="brand">ClassTime</h1>
            <p className="tagline">
                Manage your academic schedule with efficiency and precision
            </p>
            <p className="iam">I am . . .</p>
        </div>
        <div className="role-grid" >
            {roles.map(({ key, label, Icon }) => (
                <div key={key} className="role-card" onClick={() => handleRoleClick(key)}>
                    <div className="role-circle">
                        <Icon className="role-icon" />
                        <span className="role-label">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    </section>
  )
}
export default UserSelection;