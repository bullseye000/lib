import sqlite3

DB_PATH = "database.db"
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("🔄 Checking database...")

# 1. Check if books_old exists
c.execute("""
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='books_old';
""")
exists = c.fetchone()

if exists:
    print("⚠️ Found old leftover table 'books_old' — deleting it...")
    c.execute("DROP TABLE books_old;")
    conn.commit()

# 2. Check if current books table already has ONLY required columns
c.execute("PRAGMA table_info(books);")
cols = [col[1] for col in c.fetchall()]

required = {"id", "title", "author", "category", "total_copies", "available_copies", "created_at"}

if set(cols) == required:
    print("✅ Books table is already clean. No migration needed.")
    conn.close()
    exit()

print("🔧 Migrating books table...")

# 3. Rename existing books table
c.execute("ALTER TABLE books RENAME TO books_old;")

# 4. Create cleaned books table
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

# 5. Copy existing valid columns
c.execute("""
INSERT INTO books (id, title, author, category, total_copies, available_copies, created_at)
SELECT id, title, author, category, total_copies, available_copies, created_at
FROM books_old;
""")

# 6. Drop old table
c.execute("DROP TABLE books_old;")

conn.commit()
conn.close()

print("🎉 Migration completed successfully!")
