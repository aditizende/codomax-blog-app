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

// ================= AUTH ROUTES =================

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

// ================= BLOG CRUD & SEARCH ROUTES =================

// 1. CREATE BLOG (CREATE)
app.post('/api/blogs', async (req, res) => {
  try {
    const { title, content, category, authorName } = req.body;

    const newBlog = new Blog({ 
      title, 
      content, 
      category: category || 'General', 
      authorName 
    });
    await newBlog.save();

    res.status(201).json({ message: "Blog created successfully!", blog: newBlog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. READ ALL BLOGS & SEARCH/FILTER (READ)
app.get('/api/blogs', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. READ SINGLE BLOG BY ID (READ)
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found!" });

    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ error: "Invalid Blog ID or server error" });
  }
});

// 4. UPDATE BLOG BY ID (UPDATE)
app.put('/api/blogs/:id', async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, category },
      { new: true }
    );

    if (!updatedBlog) return res.status(404).json({ message: "Blog not found!" });

    res.status(200).json({ message: "Blog updated successfully!", blog: updatedBlog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE BLOG BY ID (DELETE)
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) return res.status(404).json({ message: "Blog not found!" });

    res.status(200).json({ message: "Blog deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB and start server
mongoose.connect('mongodb://localhost:27017/codomax-blog')
  .then(() => {
    console.log("Connected to MongoDB!");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch(err => console.log(err));