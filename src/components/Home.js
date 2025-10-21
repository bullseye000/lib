import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <img src="/library.jpg" alt="Library" className="home-image" />
      <div className="button-container">
        <h1>Library Management System</h1>
        <button onClick={() => navigate("/student-login")}>Student</button>
        <button onClick={() => navigate("/librarian-login")}>Librarian</button>
      </div>
    </div>
  );
}
