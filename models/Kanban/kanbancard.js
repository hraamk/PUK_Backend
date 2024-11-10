const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  columnId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  dueDate: Date,
  labels: [{
    type: String,
    trim: true
  }],
  tasks: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeEstimate: {
    type: Number,
    min: 0,
    default: 0
  },
  timeSpent: {
    type: Number,
    min: 0,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
cardSchema.index({ boardId: 1, columnId: 1, order: 1 });
cardSchema.index({ userId: 1, isArchived: 1 });

const Card = mongoose.model('Card', cardSchema);
module.exports = Card;