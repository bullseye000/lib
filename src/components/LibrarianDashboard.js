import React, { useState, useEffect } from "react";
import "./HomePage.css";

export default function LibrarianDashboard() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await fetch("http://localhost:5000/api/books");
    const data = await res.json();
    setBooks(data);
  };

  const handleAddBook = async () => {
    if (!title || !author) {
      alert("Please enter both title and author");
      return;
    }

    const res = await fetch("http://localhost:5000/api/books/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author }),
    });

    const data = await res.json();
    setMessage(data.message);
    setTitle("");
    setAuthor("");
    fetchBooks();
  };

  const handleDeleteBook = async (id) => {
    const res = await fetch(`http://localhost:5000/api/books/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setMessage(data.message);
    fetchBooks();
  };

  const handleSetFine = async (id) => {
    const res = await fetch("http://localhost:5000/api/books/fine", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fine: 200 }),
    });
    const data = await res.json();
    setMessage(data.message);
    fetchBooks();
  };

  return (
    <div className="dashboard">
      <h1>Librarian Dashboard</h1>
      <div className="add-book">
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button onClick={handleAddBook}>Add Book</button>
      </div>

      <div className="book-list">
        {books.map((book) => (
          <div key={book._id} className="book-card">
            <h3>{book.title}</h3>
            <p>Author: {book.author}</p>
            <p>Status: {book.available ? "Available" : "Issued"}</p>
            <p>Fine: ₹{book.fine}</p>

            <button onClick={() => handleSetFine(book._id)}>
              Set Fine ₹200
            </button>
            <button
              onClick={() => handleDeleteBook(book._id)}
              style={{ backgroundColor: "red" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <p>{message}</p>
    </div>
  );
}
