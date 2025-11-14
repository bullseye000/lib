const API_URL = "http://localhost:5000/api";

// -------------------- TAB SWITCH --------------------
function switchTab(id) {
    document.querySelectorAll(".form-box").forEach(f => f.classList.add("hidden"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(id).classList.remove("hidden");

    document.getElementById("message").textContent = "";
}

// -------------------- MESSAGE --------------------
function showMessage(msg, type = "error") {
    const box = document.getElementById("message");
    box.textContent = msg;
    box.className = type;
    setTimeout(() => box.className = "", 2500);
}

// -------------------- STUDENT LOGIN --------------------
async function studentLogin() {
    const email = slEmail.value.trim();
    const password = slPassword.value.trim();

    if (!email || !password) return showMessage("Please fill all fields");

    const res = await fetch(`${API_URL}/students/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) return showMessage(data.message);

    localStorage.setItem("student", JSON.stringify(data.student));
    window.location.href = "student.html";
}

// -------------------- STUDENT REGISTER --------------------
async function studentRegister() {
    const name = srName.value.trim();
    const email = srEmail.value.trim();
    const password = srPassword.value.trim();

    if (!name || !email || !password) 
        return showMessage("Please fill all fields");

    if (password.length < 6)
        return showMessage("Password must be at least 6 characters");

    const res = await fetch(`${API_URL}/students/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) return showMessage(data.message);

    showMessage("Registered successfully!", "success");
    setTimeout(() => switchTab("studentLogin"), 800);
}

// -------------------- LIBRARIAN LOGIN --------------------
async function librarianLogin() {
    const name = llName.value.trim();
    const password = llPassword.value.trim();

    if (!name || !password) return showMessage("Please fill all fields");

    const res = await fetch(`${API_URL}/librarians/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, password })
    });

    const data = await res.json();
    if (!res.ok) return showMessage(data.message);

    localStorage.setItem("librarian", JSON.stringify(data.librarian));
    window.location.href = "librarian.html";
}

// -------------------- LIBRARIAN REGISTER --------------------
async function librarianRegister() {
    const name = lrName.value.trim();
    const librarian_id = lrId.value.trim();
    const password = lrPassword.value.trim();

    if (!name || !librarian_id || !password)
        return showMessage("Please fill all fields");

    if (password.length < 6)
        return showMessage("Password must be at least 6 characters");

    const res = await fetch(`${API_URL}/librarians/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, librarian_id, password })
    });

    const data = await res.json();
    if (!res.ok) return showMessage(data.message);

    showMessage("Librarian registered!", "success");
    setTimeout(() => switchTab("librarianLogin"), 800);
}
