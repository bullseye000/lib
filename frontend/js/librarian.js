// librarian.js (FULLY FIXED)
const API_URL = "http://localhost:5000/api";
const librarian = JSON.parse(localStorage.getItem("librarian"));

if (!librarian) window.location.href = "index.html";

function logout() {
    localStorage.removeItem("librarian");
    window.location.href = "index.html";
}

// ---------------------- LOAD STATS ----------------------
async function loadStats() {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();

    stats.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><h2>${data.total_books}</h2><p>Total Books</p></div>
            <div class="stat"><h2>${data.available_books}</h2><p>Available</p></div>
            <div class="stat"><h2>${data.currently_borrowed}</h2><p>Borrowed</p></div>
            <div class="stat"><h2>${data.total_students}</h2><p>Students</p></div>
        </div>
    `;
}

loadStats();

// ---------------------- MANAGE BOOKS ----------------------
async function loadManageBooks() {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    event.target.classList.add("active");

    content.innerHTML = `
        <div class="add-card">
            <h3>Add Book</h3>
            <input id="title" placeholder="Title">
            <input id="author" placeholder="Author">
            <input id="category" placeholder="Category">
            <input id="copies" type="number" min="1" value="1">
            <button onclick="addBook()">Add</button>
        </div>

        <div id="bookList"></div>
    `;
    loadBooks();
}

async function addBook() {
    await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            title: title.value,
            author: author.value,
            category: category.value,
            total_copies: parseInt(copies.value)
        })
    });

    alert("Book added!");
    loadBooks();
}

async function loadBooks() {
    const res = await fetch(`${API_URL}/books`);
    const data = await res.json();

    let html = `<div class="grid">`;

    data.books.forEach(b => {
        html += `
        <div class="card">
            <h3>${b.title}</h3>
            <p>${b.author}</p>
            <p>${b.category || "N/A"}</p>
            <p>${b.available_copies}/${b.total_copies} copies</p>

            <button onclick="openEdit(${b.id})">Edit</button>
            <button onclick="deleteBook(${b.id})">Delete</button>
        </div>`;
    });

    html += `</div>`;
    bookList.innerHTML = html;
}

async function deleteBook(id) {
    await fetch(`${API_URL}/books/${id}`, { method:"DELETE" });
    alert("Deleted");
    loadBooks();
}

// ---------------------- EDIT BOOK ----------------------
async function openEdit(id) {
    const res = await fetch(`${API_URL}/books/${id}`);
    const data = await res.json();
    const book = data.book;

    const newName = prompt("Enter new title:", book.title);
    const newAuthor = prompt("Enter new author:", book.author);
    const newCategory = prompt("Enter new category:", book.category);
    const newCopies = prompt("Enter total copies:", book.total_copies);

    if (!newName || !newAuthor || !newCopies) return;

    await fetch(`${API_URL}/books/${id}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            title: newName,
            author: newAuthor,
            category: newCategory,
            total_copies: parseInt(newCopies),
            available_copies: parseInt(newCopies)
        })
    });

    alert("Book updated!");
    loadBooks();
}

// ---------------------- BORROWED BOOKS (FIXED) ----------------------
async function loadBorrowedBooks() {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    event.target.classList.add("active");

    content.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/borrowed-books`);
    const data = await res.json();

    let html = `<div class="grid">`;

    data.borrowed_books.forEach(b => {
        html += `
        <div class="card">
            <h3>${b.book_title}</h3>
            <p>Student: ${b.student_name}</p>
            <p>Borrowed: ${b.borrow_date}</p>
            <p>Due: ${b.due_date}</p>
            <span class="badge">${b.status}</span>
        </div>`;
    });

    html += `</div>`;
    content.innerHTML = html;
}

// ---------------------- STUDENTS LIST ----------------------
async function loadStudents() {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    event.target.classList.add("active");

    content.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/students`);
    const data = await res.json();

    let html = `<table class="table">
        <tr><th>ID</th><th>Name</th><th>Email</th></tr>`;

    data.students.forEach(s => {
        html += `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>
        </tr>`;
    });

    html += `</table>`;
    content.innerHTML = html;
}

// Initial load
loadManageBooks();
