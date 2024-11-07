const mongoose = require('mongoose');

const kanbanBoardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boards: [{
    id: String,
    title: String,
    color: String,
    emoji: String,
    order: Number
  }]
}, { timestamps: true });

const KanbanBoard = mongoose.model('KanbanBoard', kanbanBoardSchema);
module.exports = KanbanBoard;