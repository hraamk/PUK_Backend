const KanbanBoard = require('../models/Kanban/kanbanboard');
const KanbanCard = require('../models/Kanban/kanbancard');

class KanbanController {
  // Board Operations
  async getBoards(req, res) {
    try {
      // Log the user ID to verify it exists
      console.log('User ID from request:', req.user?._id);
      
      let boards = await KanbanBoard.findOne({ userId: req.user._id });
      console.log('Found boards:', boards);
      
      if (!boards) {
        console.log('Creating default boards for user:', req.user._id);
        // Create default boards if none exist
        boards = await KanbanBoard.create({
          userId: req.user._id,
          boards: [
            { id: 'backlog', title: 'Backlog', color: 'bg-gray-100', emoji: '📋', order: 0 },
            { id: 'todo', title: 'To Do', color: 'bg-blue-50', emoji: '✨', order: 1 },
            { id: 'inProgress', title: 'In Progress', color: 'bg-yellow-50', emoji: '⚡', order: 2 },
            { id: 'review', title: 'Review', color: 'bg-purple-50', emoji: '👀', order: 3 },
            { id: 'done', title: 'Done', color: 'bg-green-50', emoji: '✅', order: 4 }
          ]
        });
      }
      
      res.json(boards.boards);
    } catch (error) {
      console.error('Detailed error in getBoards:', {
        error: error.message,
        stack: error.stack,
        user: req.user?._id
      });
      res.status(500).json({ 
        message: 'Server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  }
  // Card Operations
  async getCards(req, res) {
    try {
      const cards = await KanbanCard.find({ userId: req.user._id })
        .sort({ order: 1, createdAt: -1 });
      res.json(cards);
    } catch (error) {
      console.error('Error in getCards:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createCard(req, res) {
    try {
      const cardCount = await KanbanCard.countDocuments({
        userId: req.user._id,
        boardId: req.body.boardId
      });

      const card = new KanbanCard({
        ...req.body,
        userId: req.user._id,
        order: cardCount
      });

      await card.save();
      res.status(201).json(card);
    } catch (error) {
      console.error('Error in createCard:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async updateCard(req, res) {
    try {
      const card = await KanbanCard.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { ...req.body, lastModified: Date.now() },
        { new: true, runValidators: true }
      );

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      res.json(card);
    } catch (error) {
      console.error('Error in updateCard:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async deleteCard(req, res) {
    try {
      const card = await KanbanCard.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      // Reorder remaining cards
      await KanbanCard.updateMany(
        {
          userId: req.user._id,
          boardId: card.boardId,
          order: { $gt: card.order }
        },
        { $inc: { order: -1 } }
      );

      res.json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('Error in deleteCard:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateCardPosition(req, res) {
    try {
      const { boardId, order } = req.body;
      const card = await KanbanCard.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      // Update orders of other cards
      if (card.boardId === boardId) {
        // Same board reordering
        if (order > card.order) {
          await KanbanCard.updateMany(
            {
              userId: req.user._id,
              boardId,
              order: { $gt: card.order, $lte: order }
            },
            { $inc: { order: -1 } }
          );
        } else {
          await KanbanCard.updateMany(
            {
              userId: req.user._id,
              boardId,
              order: { $gte: order, $lt: card.order }
            },
            { $inc: { order: 1 } }
          );
        }
      } else {
        // Moving to different board
        await KanbanCard.updateMany(
          {
            userId: req.user._id,
            boardId: card.boardId,
            order: { $gt: card.order }
          },
          { $inc: { order: -1 } }
        );

        await KanbanCard.updateMany(
          {
            userId: req.user._id,
            boardId,
            order: { $gte: order }
          },
          { $inc: { order: 1 } }
        );
      }

      card.boardId = boardId;
      card.order = order;
      await card.save();

      res.json(card);
    } catch (error) {
      console.error('Error in updateCardPosition:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateCardTasks(req, res) {
    try {
      const { tasks } = req.body;
      const card = await KanbanCard.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { tasks, lastModified: Date.now() },
        { new: true }
      );

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      res.json(card);
    } catch (error) {
      console.error('Error in updateCardTasks:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async addLabel(req, res) {
    try {
      const { label } = req.body;
      const card = await KanbanCard.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $addToSet: { labels: label } },
        { new: true }
      );

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      res.json(card);
    } catch (error) {
      console.error('Error in addLabel:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async removeLabel(req, res) {
    try {
      const label = req.params.label;
      const card = await KanbanCard.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $pull: { labels: label } },
        { new: true }
      );

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      res.json(card);
    } catch (error) {
      console.error('Error in removeLabel:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new KanbanController();