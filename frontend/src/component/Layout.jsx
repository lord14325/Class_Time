import React from "react";
import TopBar from "../component/TopBar";
import SideBar from "../component/SideBar";
import "../styles/styles.css";


function Layout({ children }) {
  return (
    <div className="layout">
      <TopBar />
      <div className="layout-content">
        <SideBar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;