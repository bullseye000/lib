import sqlite3

DB_PATH = "database.db"

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("🔄 Starting migration...")

# 1. Rename old table
c.execute("ALTER TABLE books RENAME TO books_old;")

# 2. Create new cleaned table
c.execute("""
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,
    total_copies INTEGER NOT NULL,
    available_copies INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
""")

# 3. Copy only required columns
c.execute("""
INSERT INTO books (id, title, author, category, total_copies, available_copies, created_at)
SELECT id, title, author, category, total_copies, available_copies, created_at
FROM books_old;
""")

# 4. Drop old table
c.execute("DROP TABLE books_old;")

conn.commit()
conn.close()

print("✅ Migration complete! Removed isbn, description, image_url.")
