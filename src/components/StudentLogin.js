import React, { useState } from "react";
import "./FormPage.css";

export default function StudentLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    const endpoint = isRegister
      ? "http://localhost:5000/api/student/register"
      : "http://localhost:5000/api/student/login";

    // Prepare body data correctly based on register/login
    const bodyData = isRegister
      ? { name, email, password }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        if (!isRegister) {
          // Login success — go to student dashboard
          window.location.href = "/student-dashboard";
        }
      } else {
        setMessage(data.message || "Something went wrong");
      }
    } catch (error) {
      setMessage("⚠️ Server not reachable");
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>{isRegister ? "Student Register" : "Student Login"}</h2>

        {isRegister && (
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="button" onClick={handleSubmit}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p className="toggle-text">
          {isRegister ? "Already have an account?" : "New student?"}{" "}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
            style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
          >
            {isRegister ? "Login here" : "Register here"}
          </span>
        </p>

        <p className="message">{message}</p>
      </div>
    </div>
  );
}
