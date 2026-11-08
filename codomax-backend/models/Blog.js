const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
  authorName: { type: String, default: 'Anonymous' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Links blog to a specific user
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);