const API_URL = "http://localhost:5000/api";
const student = JSON.parse(localStorage.getItem("student"));

if (!student) window.location.href = "index.html";

welcomeText.textContent = `Welcome, ${student.name}!`;

function logout() {
    localStorage.removeItem("student");
    window.location.href = "index.html";
}

// ------------------------ LOAD AVAILABLE BOOKS ------------------------
async function loadAvailable() {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");

    content.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/books/available`);
    const data = await res.json();

    let html = `<div class="grid">`;

    data.books.forEach(b => {
        html += `
        <div class="card">
            <h3>${b.title}</h3>
            <p>${b.author}</p>
            <p>${b.category || "N/A"}</p>
            <p>${b.available_copies}/${b.total_copies}</p>

            <button onclick="borrowBook(${b.id}, '${b.title}')">Borrow</button>
        </div>`;
    });

    html += `</div>`;
    content.innerHTML = html;
}

// ------------------------ BORROW BOOK ------------------------
async function borrowBook(bookId, title) {
    if (!confirm(`Borrow "${title}"?`)) return;

    const res = await fetch(`${API_URL}/borrow`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ student_id: student.id, book_id: bookId })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    alert("Book Borrowed!");
    loadAvailable();
}

// ------------------------ MY BOOKS ------------------------
async function loadMyBooks() {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");

    content.innerHTML = `<div class="loading">Loading...</div>`;

    const res = await fetch(`${API_URL}/students/${student.id}/borrowed-books`);
    const data = await res.json();

    let html = `<div class="grid">`;

    data.borrowed_books.forEach(b => {
        html += `
        <div class="card">
            <h3>${b.book_title}</h3>
            <p><strong>Borrowed:</strong> ${b.borrow_date}</p>
            <p><strong>Due:</strong> ${b.due_date}</p>
            ${b.status === "borrowed"
                ? `<button onclick="returnBook(${b.id}, '${b.book_title}')">Return</button>`
                : `<p class="success">Returned</p>`
            }
        </div>`;
    });

    html += `</div>`;
    content.innerHTML = html;
}

// ------------------------ RETURN BOOK ------------------------
async function returnBook(id, title) {
    if (!confirm(`Return "${title}"?`)) return;

    await fetch(`${API_URL}/return/${id}`, { method: "PUT" });

    alert("Book Returned!");
    loadMyBooks();
}

// INITIAL LOAD
loadAvailable();
