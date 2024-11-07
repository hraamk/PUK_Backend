const mongoose = require('mongoose');


const kanbanCardSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    boardId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    dueDate: Date,
    labels: [String],
    tasks: [{
      id: String,
      text: String,
      completed: Boolean
    }],
    timeEstimate: Number,
    timeSpent: Number,
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'on-hold', 'completed'],
      default: 'not-started'
    },
    assignee: {
      id: String,
      name: String,
      avatar: String
    },
    order: {
      type: Number,
      default: 0
    },
    isStarred: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });
  
  const KanbanCard = mongoose.model('KanbanCard', kanbanCardSchema);
  module.exports = KanbanCard;