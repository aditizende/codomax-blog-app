const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
  authorName: { type: String, default: 'Anonymous' }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);