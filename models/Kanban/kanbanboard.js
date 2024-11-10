const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  columns: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'bg-gray-100'
    },
    emoji: {
      type: String,
      default: '📋'
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  settings: {
    cardColors: {
      type: Boolean,
      default: true
    },
    showCardCount: {
      type: Boolean,
      default: true
    },
    defaultCardColor: {
      type: String,
      default: 'bg-white'
    }
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for faster queries
boardSchema.index({ userId: 1, isArchived: 1 });

// Middleware to ensure at least one column exists
boardSchema.pre('save', function(next) {
  if (!this.columns || this.columns.length === 0) {
    this.columns = [{
      id: 'default',
      title: 'To Do',
      color: 'bg-gray-100',
      emoji: '📋',
      order: 0
    }];
  }
  next();
});

const Board = mongoose.model('Board', boardSchema);
module.exports = Board;