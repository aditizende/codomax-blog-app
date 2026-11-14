const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Blog = require('./models/Blog');
const verifyToken = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "my_super_secret_key_123";

// Root welcome route for Render health check
app.get('/', (req, res) => {
  res.send('Codomax Blog API is running live!');
});

// ================= AUTH ROUTES =================

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token, username: user.username, userId: user._id, message: "Login successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found!" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= BLOG ROUTES =================

app.post('/api/blogs', verifyToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const newBlog = new Blog({
      title,
      content,
      category: category || 'General',
      authorName: req.user.username,
      user: req.user.id
    });
    await newBlog.save();
    res.status(201).json({ message: "Blog created successfully!", blog: newBlog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/blogs/user/dashboard', verifyToken, async (req, res) => {
  try {
    const userBlogs = await Blog.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(userBlogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found!" });
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ error: "Invalid Blog ID or server error" });
  }
});

app.put('/api/blogs/:id', verifyToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content, category },
      { new: true }
    );
    if (!updatedBlog) return res.status(404).json({ message: "Blog not found or unauthorized!" });
    res.status(200).json({ message: "Blog updated successfully!", blog: updatedBlog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/blogs/:id', verifyToken, async (req, res) => {
  try {
    const deletedBlog = await Blog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedBlog) return res.status(404).json({ message: "Blog not found or unauthorized!" });
    res.status(200).json({ message: "Blog deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to Cloud MongoDB!"))
    .catch(err => console.log("MongoDB error:", err.message));
} else {
  mongoose.connect('mongodb://localhost:27017/codomax-blog')
    .then(() => console.log("Connected to Local MongoDB!"))
    .catch(() => console.log("Running in cloud mode without local MongoDB."));
}