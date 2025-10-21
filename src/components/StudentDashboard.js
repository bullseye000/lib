import React, { useState, useEffect } from "react";
import "./Dashboard.css";

export default function StudentDashboard() {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Fetch all books when the page loads
  useEffect(() => {
    fetch("http://localhost:5000/api/books")
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
        setFiltered(data);
      })
      .catch(() => alert("⚠️ Cannot fetch books. Start your backend first."));
  }, []);

  // Search books by title
  const handleSearch = () => {
    const result = books.filter((book) =>
      book.title.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h2>📚 Student Dashboard</h2>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search book by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="book-list">
          {filtered.length > 0 ? (
            filtered.map((book) => (
              <div key={book.id} className="book-card">
                <h4>{book.title}</h4>
                <p>Author: {book.author}</p>
                <p>
                  Status:{" "}
                  <strong
                    style={{
                      color: book.available ? "green" : "red",
                    }}
                  >
                    {book.available ? "Available" : "Issued"}
                  </strong>
                </p>
                <p>Fine: ₹{book.fine}</p>
              </div>
            ))
          ) : (
            <p>No books found 🔍</p>
          )}
        </div>
      </div>
    </div>
  );
}
