const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Blog = require('./models/Blog');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "my_super_secret_key_123";

// 1. REGISTER API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);

    res.status(200).json({ token, username: user.username, message: "Login successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE BLOG API
app.post('/api/blogs', async (req, res) => {
  try {
    const { title, content, authorName } = req.body;

    const newBlog = new Blog({ title, content, authorName });
    await newBlog.save();

    res.status(201).json({ message: "Blog created successfully!", blog: newBlog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET ALL BLOGS API
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET SINGLE BLOG BY ID API (Added for Module 3)
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found!" });

    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ error: "Invalid Blog ID or server error" });
  }
});

// Connect to MongoDB and start server
mongoose.connect('mongodb://localhost:27017/codomax-blog')
  .then(() => {
    console.log("Connected to MongoDB!");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch(err => console.log(err));