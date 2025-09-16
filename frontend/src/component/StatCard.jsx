import React from "react";
import "../styles/StatCard.css";

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

export default StatCard;
