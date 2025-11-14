from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# ---------------------- DATABASE ----------------------
def db():
    return sqlite3.connect("database.db", check_same_thread=False)


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# ---------------------- STUDENT REGISTER ----------------------
@app.route("/api/students/register", methods=["POST"])
def student_register():
    data = request.json
    name = data["name"]
    email = data["email"]
    password = hash_password(data["password"])

    con = db()
    cur = con.cursor()

    cur.execute("SELECT * FROM students WHERE email=?", (email,))
    if cur.fetchone():
        return jsonify({"message": "Email already registered"}), 400

    cur.execute(
        "INSERT INTO students (name, email, password) VALUES (?, ?, ?)",
        (name, email, password)
    )
    con.commit()

    return jsonify({"message": "Student registered"}), 201


# ---------------------- STUDENT LOGIN ----------------------
@app.route("/api/students/login", methods=["POST"])
def student_login():
    data = request.json
    email = data["email"]
    password = hash_password(data["password"])

    con = db()
    cur = con.cursor()
    cur.execute(
        "SELECT id, name, email FROM students WHERE email=? AND password=?",
        (email, password)
    )
    r = cur.fetchone()

    if not r:
        return jsonify({"message": "Invalid login"}), 401

    return jsonify({"student": {"id": r[0], "name": r[1], "email": r[2]}})


# ---------------------- LIBRARIAN REGISTER ----------------------
@app.route("/api/librarians/register", methods=["POST"])
def librarian_register():
    data = request.json
    name = data["name"]
    librarian_id = data["librarian_id"]
    password = hash_password(data["password"])

    con = db()
    cur = con.cursor()

    cur.execute("SELECT * FROM librarians WHERE librarian_id=?", (librarian_id,))
    if cur.fetchone():
        return jsonify({"message": "Librarian ID already exists"}), 400

    cur.execute(
        "INSERT INTO librarians (name, librarian_id, password) VALUES (?, ?, ?)",
        (name, librarian_id, password)
    )
    con.commit()

    return jsonify({"message": "Librarian registered"}), 201


# ---------------------- LIBRARIAN LOGIN ----------------------
@app.route("/api/librarians/login", methods=["POST"])
def librarian_login():
    data = request.json
    name = data["name"]
    password = hash_password(data["password"])

    con = db()
    cur = con.cursor()
    cur.execute(
        "SELECT id, name, librarian_id FROM librarians WHERE name=? AND password=?",
        (name, password)
    )
    r = cur.fetchone()

    if not r:
        return jsonify({"message": "Invalid login"}), 401

    return jsonify({
        "librarian": {"id": r[0], "name": r[1], "librarian_id": r[2]}
    })


# ---------------------- ADD BOOK ----------------------
@app.route("/api/books", methods=["POST"])
def add_book():
    data = request.json
    title = data["title"]
    author = data["author"]
    category = data["category"]
    total = int(data["total_copies"])

    con = db()
    cur = con.cursor()
    cur.execute("""
        INSERT INTO books (title, author, category, total_copies, available_copies)
        VALUES (?, ?, ?, ?, ?)
    """, (title, author, category, total, total))

    con.commit()
    return jsonify({"message": "Book added"}), 201


# ---------------------- GET ALL BOOKS ----------------------
@app.route("/api/books", methods=["GET"])
def get_books():
    con = db()
    cur = con.cursor()
    cur.execute("SELECT * FROM books")
    rows = cur.fetchall()

    books = [{
        "id": r[0], "title": r[1], "author": r[2],
        "category": r[3], "total_copies": r[4], "available_copies": r[5]
    } for r in rows]

    return jsonify({"books": books})


# ---------------------- GET A BOOK ----------------------
@app.route("/api/books/<int:id>", methods=["GET"])
def get_book(id):
    con = db()
    cur = con.cursor()

    cur.execute("SELECT * FROM books WHERE id=?", (id,))
    r = cur.fetchone()

    if not r:
        return jsonify({"message": "Book not found"}), 404

    return jsonify({
        "book": {
            "id": r[0], "title": r[1], "author": r[2],
            "category": r[3], "total_copies": r[4], "available_copies": r[5]
        }
    })


# ---------------------- EDIT BOOK ----------------------
@app.route("/api/books/<int:id>", methods=["PUT"])
def edit_book(id):
    data = request.json

    con = db()
    cur = con.cursor()
    cur.execute("""
        UPDATE books
        SET title=?, author=?, category=?, total_copies=?, available_copies=?
        WHERE id=?
    """, (
        data["title"],
        data["author"],
        data["category"],
        data["total_copies"],
        data["available_copies"],
        id
    ))

    con.commit()
    return jsonify({"message": "Updated"})


# ---------------------- DELETE BOOK ----------------------
@app.route("/api/books/<int:id>", methods=["DELETE"])
def delete_book(id):
    con = db()
    cur = con.cursor()
    cur.execute("DELETE FROM books WHERE id=?", (id,))
    con.commit()
    return jsonify({"message": "Deleted"})


# ---------------------- AVAILABLE BOOKS ----------------------
@app.route("/api/books/available", methods=["GET"])
def available_books():
    con = db()
    cur = con.cursor()
    cur.execute("SELECT * FROM books WHERE available_copies > 0")
    rows = cur.fetchall()

    books = [{
        "id": r[0], "title": r[1], "author": r[2],
        "category": r[3], "total_copies": r[4], "available_copies": r[5]
    } for r in rows]

    return jsonify({"books": books})


# ---------------------- BORROW BOOK ----------------------
@app.route("/api/borrow", methods=["POST"])
def borrow_book():
    data = request.json
    student_id = data["student_id"]
    book_id = data["book_id"]

    con = db()
    cur = con.cursor()

    # check availability
    cur.execute("SELECT available_copies FROM books WHERE id=?", (book_id,))
    b = cur.fetchone()

    if not b or b[0] <= 0:
        return jsonify({"message": "Book unavailable"}), 400

    borrow_date = datetime.now()
    due_date = borrow_date + timedelta(days=7)

    cur.execute("""
        INSERT INTO borrowed_books 
        (student_id, book_id, borrow_date, due_date, status)
        VALUES (?, ?, ?, ?, 'borrowed')
    """, (student_id, book_id, borrow_date, due_date))

    cur.execute("""
        UPDATE books SET available_copies = available_copies - 1 WHERE id=?
    """, (book_id,))

    con.commit()
    return jsonify({"message": "Book borrowed"})


# ---------------------- RETURN BOOK ----------------------
@app.route("/api/return/<int:id>", methods=["PUT"])
def return_book(id):
    con = db()
    cur = con.cursor()

    cur.execute("""
        UPDATE borrowed_books
        SET status='returned', return_date=?
        WHERE id=?
    """, (datetime.now(), id))

    cur.execute("""
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE id = (SELECT book_id FROM borrowed_books WHERE id=?)
    """, (id,))

    con.commit()
    return jsonify({"message": "Book returned"})


# ---------------------- STUDENT BORROWED BOOKS ----------------------
@app.route("/api/students/<int:id>/borrowed-books", methods=["GET"])
def student_borrowed_books(id):
    con = db()
    cur = con.cursor()

    cur.execute("""
        SELECT b.id, b.book_id, bk.title, bk.author, 
               b.borrow_date, b.due_date, b.return_date, b.status
        FROM borrowed_books b
        JOIN books bk ON b.book_id = bk.id
        WHERE student_id=?
    """, (id,))

    rows = cur.fetchall()

    books = [{
        "id": r[0], "book_id": r[1],
        "book_title": r[2], "book_author": r[3],
        "borrow_date": r[4], "due_date": r[5],
        "return_date": r[6], "status": r[7]
    } for r in rows]

    return jsonify({"borrowed_books": books})


# ---------------------- ALL BORROWED BOOKS (LIBRARIAN) ----------------------
@app.route("/api/borrowed-books", methods=["GET"])
def all_borrowed_books():
    con = db()
    cur = con.cursor()

    cur.execute("""
        SELECT b.id, s.name, bk.title, b.borrow_date, b.due_date, b.status
        FROM borrowed_books b
        JOIN students s ON s.id = b.student_id
        JOIN books bk ON bk.id = b.book_id
        ORDER BY b.due_date ASC
    """)

    rows = cur.fetchall()

    borrowed = [{
        "id": r[0],
        "student_name": r[1],
        "book_title": r[2],
        "borrow_date": r[3],
        "due_date": r[4],
        "status": r[5]
    } for r in rows]

    return jsonify({"borrowed_books": borrowed})


# ---------------------- GET ALL STUDENTS (LIBRARIAN) ----------------------
@app.route("/api/students", methods=["GET"])
def get_all_students():
    con = db()
    cur = con.cursor()

    cur.execute("SELECT id, name, email FROM students")
    rows = cur.fetchall()

    students = [{
        "id": r[0], "name": r[1], "email": r[2]
    } for r in rows]

    return jsonify({"students": students})


# ---------------------- STATS ----------------------
@app.route("/api/stats", methods=["GET"])
def stats():
    con = db()
    cur = con.cursor()

    cur.execute("SELECT COUNT(*) FROM books")
    total_books = cur.fetchone()[0]

    cur.execute("SELECT SUM(available_copies) FROM books")
    available = cur.fetchone()[0] or 0

    cur.execute("SELECT COUNT(*) FROM borrowed_books WHERE status='borrowed'")
    borrowed = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM students")
    total_students = cur.fetchone()[0]

    return jsonify({
        "total_books": total_books,
        "available_books": available,
        "currently_borrowed": borrowed,
        "total_students": total_students
    })


# ---------------------- RUN SERVER ----------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
