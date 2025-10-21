import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import StudentLogin from "./components/StudentLogin";
import LibrarianLogin from "./components/LibrarianLogin";
import StudentDashboard from "./components/StudentDashboard";
import LibrarianDashboard from "./components/LibrarianDashboard";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/librarian-login" element={<LibrarianLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/librarian-dashboard" element={<LibrarianDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
