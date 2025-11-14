const API_URL = 'http://localhost:5000/api';

let currentUser = null;
let userType = null;

// ------------------------------------------------------
// UTILITY FUNCTIONS
// ------------------------------------------------------

function showMessage(msg, type = "error") {
    const box = document.getElementById("message");
    box.textContent = msg;
    box.className = type;
    setTimeout(() => { box.className = ""; }, 3000);
}

function showTab(id) {
    document.querySelectorAll(".form-container").forEach(f => f.classList.add("hidden"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(id).classList.remove("hidden");
}

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    document.getElementById("logoutBtn").style.display =
        id === "authPage" ? "none" : "block";
}

function formatDate(d) {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
    });
}

function isOverdue(due, status) {
    return status === "borrowed" && new Date(due) < new Date();
}

async function parseResponse(res) {
    try { return await res.json(); }
    catch { return {}; }
}

// ------------------------------------------------------
// AUTH
// ------------------------------------------------------

document.getElementById("logoutBtn").onclick = () => {
    currentUser = null;
    userType = null;
    showPage("authPage");
};

async function studentRegister() {
    const name = srName.value.trim();
    const email = srEmail.value.trim();
    const password = srPassword.value;

    if (!name || !email || !password) return showMessage("Fill all fields");

    const res = await fetch(`${API_URL}/students/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
        showMessage("Registered! Now login.", "success");
        showTab("studentLogin");
    } else showMessage(data.message);
}

async function studentLogin() {
    const email = slEmail.value.trim();
    const password = slPassword.value;

    const res = await fetch(`${API_URL}/students/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) return showMessage(data.message);

    currentUser = data.student;
    userType = "student";

    showMessage("Logged in!", "success");
    showPage("studentDashboard");
    loadStudentDashboard();
}

// ------------------------------------------------------
// LIBRARIAN AUTH
// ------------------------------------------------------

async function librarianRegister() {
    const name = lrName.value.trim();
    const librarian_id = lrId.value.trim();
    const password = lrPassword.value;

    const res = await fetch(`${API_URL}/librarians/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, librarian_id, password })
    });

    const data = await res.json();
    if (res.ok) {
        showMessage("Registered! Login now.", "success");
        showTab("librarianLogin");
    } else showMessage(data.message);
}

async function librarianLogin() {
    const name = llName.value.trim();
    const password = llPassword.value;

    const res = await fetch(`${API_URL}/librarians/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password })
    });

    const data = await res.json();

    if (!res.ok) return showMessage(data.message);

    currentUser = data.librarian;
    userType = "librarian";

    showPage("librarianDashboard");
    loadLibrarianDashboard();
}

// ------------------------------------------------------
// STUDENT DASHBOARD
// ------------------------------------------------------

function loadStudentDashboard() {
    studentContent.innerHTML = `
        <h2>Welcome, ${currentUser.name}</h2>
        <div class="dashboard-tabs">
            <button class="active" onclick="loadAvailableBooks()">Available Books</button>
            <button onclick="loadMyBooks()">My Books</button>
        </div>
        <div id="dashContent"></div>
    `;
    loadAvailableBooks();
}

async function loadAvailableBooks() {
    dashContent.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/books/available`);
    const data = await parseResponse(res);
    const books = data.books || [];

    if (!books.length) {
        return dashContent.innerHTML = `<div class="empty-state">No books available.</div>`;
    }

    let html = `<div class="books-grid">`;

    books.forEach(b => {
        html += `
        <div class="book-card">
            <img src="https://via.placeholder.com/200?text=Book">
            <h4>${b.title}</h4>
            <p><strong>Author:</strong> ${b.author}</p>
            <p><strong>Category:</strong> ${b.category || "N/A"}</p>
            <p><strong>Available:</strong> ${b.available_copies}/${b.total_copies}</p>
            <button onclick="borrowBook(${b.id}, '${b.title}')">Borrow</button>
        </div>`;
    });

    html += `</div>`;
    dashContent.innerHTML = html;
}

async function borrowBook(bookId, title) {
    if (!confirm(`Borrow "${title}"?`)) return;

    const res = await fetch(`${API_URL}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: currentUser.id, book_id: bookId })
    });

    const data = await res.json();
    alert(data.message);
    loadAvailableBooks();
}

async function loadMyBooks() {
    dashContent.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/students/${currentUser.id}/borrowed-books`);
    const data = await parseResponse(res);
    const list = data.borrowed_books || [];

    if (!list.length) {
        return dashContent.innerHTML = `<div class="empty-state">No borrowed books.</div>`;
    }

    let html = `<div class="borrowed-list">`;

    list.forEach(r => {
        const overdue = isOverdue(r.due_date, r.status);

        html += `
        <div class="borrowed-item ${overdue ? "overdue" : ""}">
            <img src="https://via.placeholder.com/120?text=Book">

            <div>
                <h4>${r.book_title}</h4>
                <p><strong>Borrowed:</strong> ${formatDate(r.borrow_date)}</p>
                <p><strong>Due:</strong> ${formatDate(r.due_date)}</p>
                ${r.return_date ? `<p><strong>Returned:</strong> ${formatDate(r.return_date)}</p>` : ""}
            </div>

            ${r.status === "borrowed"
                ? `<button onclick="returnBook(${r.id}, '${r.book_title}')">Return</button>`
                : ""}
        </div>`;
    });

    html += `</div>`;
    dashContent.innerHTML = html;
}

async function returnBook(id, title) {
    if (!confirm(`Return "${title}"?`)) return;

    const res = await fetch(`${API_URL}/return/${id}`, { method: "PUT" });
    const data = await res.json();

    alert(data.message);
    loadMyBooks();
}

// ------------------------------------------------------
// LIBRARIAN DASHBOARD
// ------------------------------------------------------

async function loadLibrarianDashboard() {
    librarianContent.innerHTML = `
        <h2>Librarian Dashboard</h2>

        <div id="statsSection"></div>

        <div class="dashboard-tabs">
            <button class="active" onclick="loadManageBooks()">Manage Books</button>
            <button onclick="loadBorrowedBooks()">Borrowed Books</button>
            <button onclick="loadStudents()">Students</button>
        </div>

        <div id="dashContent"></div>
    `;

    loadStats();
    loadManageBooks();
}

async function loadStats() {
    const res = await fetch(`${API_URL}/stats`);
    const data = await parseResponse(res);

    statsSection.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><h3>${data.total_books}</h3><p>Total Books</p></div>
            <div class="stat-card"><h3>${data.available_books}</h3><p>Available</p></div>
            <div class="stat-card"><h3>${data.currently_borrowed}</h3><p>Borrowed</p></div>
            <div class="stat-card"><h3>${data.total_students}</h3><p>Students</p></div>
        </div>
    `;
}

// ------------------------------------------------------
// MANAGE BOOKS
// ------------------------------------------------------

async function loadManageBooks() {
    dashContent.innerHTML = `
        <div class="add-book-section">
            <h3>Add Book</h3>
            <input type="text" id="bookTitle" placeholder="Title">
            <input type="text" id="bookAuthor" placeholder="Author">
            <input type="text" id="bookCategory" placeholder="Category">
            <input type="number" id="bookCopies" min="1" value="1">
            <button onclick="addBook()">Add</button>
        </div>

        <h3>All Books</h3>
        <div id="booksList"></div>
    `;

    loadAllBooks();
}

async function addBook() {
    const title = bookTitle.value.trim();
    const author = bookAuthor.value.trim();
    const category = bookCategory.value.trim();
    const total_copies = bookCopies.value;

    if (!title || !author) return alert("Enter required fields");

    const res = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title, author, category,
            total_copies: parseInt(total_copies)
        })
    });

    const data = await res.json();
    alert(data.message);
    loadAllBooks();
}

async function loadAllBooks() {
    const res = await fetch(`${API_URL}/books`);
    const data = await parseResponse(res);
    const books = data.books || [];

    if (!books.length) {
        booksList.innerHTML = `<div class="empty-state">No books.</div>`;
        return;
    }

    let html = `<div class="books-grid">`;

    books.forEach(b => {
        html += `
        <div class="book-card">
            <img src="https://via.placeholder.com/200?text=Book">

            <h4>${b.title}</h4>
            <p><strong>Author:</strong> ${b.author}</p>
            <p><strong>Category:</strong> ${b.category || "N/A"}</p>
            <p><strong>Copies:</strong> ${b.available_copies}/${b.total_copies}</p>

            <button onclick="openEditModal(${b.id})">Edit</button>
            <button onclick="deleteBook(${b.id}, '${b.title}')">Delete</button>
        </div>`;
    });

    html += `</div>`;
    booksList.innerHTML = html;
}

async function deleteBook(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;

    const res = await fetch(`${API_URL}/books/${id}`, { method: "DELETE" });
    const data = await res.json();

    alert(data.message);
    loadAllBooks();
}

// ------------------------------------------------------
// EDIT BOOK MODAL
// ------------------------------------------------------

async function openEditModal(id) {
    editModal.style.display = "block";

    const res = await fetch(`${API_URL}/books/${id}`);
    const data = await parseResponse(res);

    const b = data.book;

    editBookId.value = id;
    editTitle.value = b.title;
    editAuthor.value = b.author;
    editCategory.value = b.category || "";
    editCopies.value = b.total_copies;
}

function closeEditModal() {
    editModal.style.display = "none";
}

async function saveEditBook() {
    const id = editBookId.value;

    const res = await fetch(`${API_URL}/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: editTitle.value,
            author: editAuthor.value,
            category: editCategory.value,
            total_copies: parseInt(editCopies.value)
        })
    });

    const data = await res.json();
    alert(data.message);

    closeEditModal();
    loadAllBooks();
}

// ------------------------------------------------------
// BORROWED BOOKS (LIBRARIAN)
// ------------------------------------------------------

async function loadBorrowedBooks() {
    dashContent.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/borrowed-books`);
    const data = await parseResponse(res);
    const list = data.borrowed_books || [];

    if (!list.length) {
        return dashContent.innerHTML = `<div class="empty-state">No borrowed books.</div>`;
    }

    let html = `<div class="borrowed-list">`;

    list.forEach(r => {
        const overdue = isOverdue(r.due_date, r.status);

        html += `
        <div class="borrowed-item ${overdue ? 'overdue' : ''}">
            <img src="https://via.placeholder.com/120?text=Book">

            <div>
                <h4>${r.book_title}</h4>
                <p><strong>Student:</strong> ${r.student_name}</p>
                <p><strong>Borrowed:</strong> ${formatDate(r.borrow_date)}</p>
                <p><strong>Due:</strong> ${formatDate(r.due_date)}</p>
            </div>

            ${r.status === "borrowed"
                ? `<button onclick="returnBook(${r.id}, '${r.book_title}')">Return</button>`
                : ""}
        </div>`;
    });

    html += `</div>`;
    dashContent.innerHTML = html;
}

// ------------------------------------------------------
// STUDENTS (LIBRARIAN)
// ------------------------------------------------------

async function loadStudents() {
    dashContent.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/students`);
    const data = await parseResponse(res);

    const list = data.students || [];

    let html = `<table class="table">
        <tr><th>ID</th><th>Name</th><th>Email</th></tr>`;

    list.forEach(s => {
        html += `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>
        </tr>`;
    });

    html += `</table>`;
    dashContent.innerHTML = html;
}
