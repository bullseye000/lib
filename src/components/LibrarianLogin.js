import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FormPage.css";

export default function LibrarianLogin() {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const endpoint = isRegister
      ? "http://localhost:5000/api/librarian/register"
      : "http://localhost:5000/api/librarian/login";

    const bodyData = isRegister ? { name, id, password } : { name, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok && !isRegister) {
      navigate("/librarian-dashboard");
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>{isRegister ? "Librarian Register" : "Librarian Login"}</h2>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {isRegister && (
          <input
            type="text"
            placeholder="Enter Librarian ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        )}
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSubmit}>
          {isRegister ? "Register" : "Login"}
        </button>
        <p>
          {isRegister ? "Already registered?" : "New librarian?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: "blue", cursor: "pointer" }}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
        <p>{message}</p>
      </div>
    </div>
  );
}
