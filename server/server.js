require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const serverless = require("serverless-http");

const app = express();
app.use(cors());
app.use(express.json());

// Configure AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const docClient = new AWS.DynamoDB.DocumentClient();

const STUDENTS_TABLE = "Students";
const LIBRARIANS_TABLE = "Librarians";
const BOOKS_TABLE = "Books";

// Helper function to check if an item exists in DynamoDB table
async function getItemByKey(table, key) {
  const params = {
    TableName: table,
    Key: key,
  };
  const data = await docClient.get(params).promise();
  return data.Item;
}

// ✅ Student Register
app.post("/api/student/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await getItemByKey(STUDENTS_TABLE, { email });
    if (existing) return res.status(400).json({ message: "Student already registered" });

    const hashed = await bcrypt.hash(password, 8);

    const params = {
      TableName: STUDENTS_TABLE,
      Item: { name, email, password: hashed },
    };

    await docClient.put(params).promise();
    res.json({ message: "✅ Student registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Student Login
app.post("/api/student/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await getItemByKey(STUDENTS_TABLE, { email });
    if (!student) return res.status(400).json({ message: "Student not found" });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    res.json({ message: "✅ Student login successful" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Librarian Register
app.post("/api/librarian/register", async (req, res) => {
  try {
    const { name, id, password } = req.body;
    if (!name || !id || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await getItemByKey(LIBRARIANS_TABLE, { name });
    if (existing) return res.status(400).json({ message: "Librarian already exists" });

    const hashed = await bcrypt.hash(password, 8);

    const params = {
      TableName: LIBRARIANS_TABLE,
      Item: { name, id, password: hashed },
    };

    await docClient.put(params).promise();
    res.json({ message: "✅ Librarian registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Librarian Login
app.post("/api/librarian/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    const librarian = await getItemByKey(LIBRARIANS_TABLE, { name });
    if (!librarian) return res.status(400).json({ message: "Librarian not found" });

    const valid = await bcrypt.compare(password, librarian.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    res.json({ message: "✅ Librarian login successful" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Add a new book
app.post("/api/books/add", async (req, res) => {
  try {
    const { title, author } = req.body;
    if (!title || !author)
      return res.status(400).json({ message: "Both title and author are required" });

    const id = Date.now().toString();
    const params = {
      TableName: BOOKS_TABLE,
      Item: {
        id,
        title,
        author,
        available: true,
        issuedTo: "",
        fine: 200,
      },
    };

    await docClient.put(params).promise();

    // Scan to get all books
    const allBooks = await docClient.scan({ TableName: BOOKS_TABLE }).promise();

    res.json({ message: "✅ Book added successfully!", books: allBooks.Items });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Get all books
app.get("/api/books", async (req, res) => {
  try {
    const data = await docClient.scan({ TableName: BOOKS_TABLE }).promise();
    res.json(data.Items);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Delete a book
app.delete("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const book = await getItemByKey(BOOKS_TABLE, { id });
    if (!book) return res.status(404).json({ message: "Book not found" });

    await docClient.delete({ TableName: BOOKS_TABLE, Key: { id } }).promise();

    const allBooks = await docClient.scan({ TableName: BOOKS_TABLE }).promise();
    res.json({ message: "✅ Book deleted successfully!", books: allBooks.Items });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Mark book as returned
app.put("/api/books/return", async (req, res) => {
  try {
    const { id } = req.body;
    const book = await getItemByKey(BOOKS_TABLE, { id });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const params = {
      TableName: BOOKS_TABLE,
      Key: { id },
      UpdateExpression: "set available = :a, issuedTo = :i, fine = :f",
      ExpressionAttributeValues: {
        ":a": true,
        ":i": "",
        ":f": 200,
      },
      ReturnValues: "ALL_NEW",
    };

    const updated = await docClient.update(params).promise();

    const allBooks = await docClient.scan({ TableName: BOOKS_TABLE }).promise();

    res.json({
      message: "✅ Book marked as returned and fine reset to ₹200",
      books: allBooks.Items,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Update fine amount
app.put("/api/books/fine", async (req, res) => {
  try {
    const { id, fine } = req.body;
    const book = await getItemByKey(BOOKS_TABLE, { id });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const params = {
      TableName: BOOKS_TABLE,
      Key: { id },
      UpdateExpression: "set fine = :f",
      ExpressionAttributeValues: {
        ":f": fine,
      },
      ReturnValues: "ALL_NEW",
    };

    await docClient.update(params).promise();

    const allBooks = await docClient.scan({ TableName: BOOKS_TABLE }).promise();

    res.json({ message: `✅ Fine updated to ₹${fine}`, books: allBooks.Items });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Library Management Backend is running ✅");
});

// Export app for serverless Lambda
module.exports.handler = serverless(app);
