// models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled'
  },
  content: {
    type: String,
    default: ''
  },
  plainText: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
});

// Index for faster queries
documentSchema.index({ owner: 1, lastModified: -1 });

// Transform the document when converting to JSON
documentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id; // Ensure _id is also available as id
    return ret;
  }
});

module.exports = mongoose.model('Document', documentSchema);