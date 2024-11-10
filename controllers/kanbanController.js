// controllers/kanbanController.js
const Board = require('../models/Kanban/kanbanboard');
const Card = require('../models/Kanban/kanbancard');
const mongoose = require('mongoose');

class KanbanController {
  // Board Operations
  async getBoards(req, res) {
    try {
      const boards = await Board.find({ 
        userId: req.user._id,
        isArchived: { $ne: true }
      }).lean();

      // Get card counts for each board
      const boardsWithCounts = await Promise.all(
        boards.map(async (board) => {
          const cardCount = await Card.countDocuments({
            boardId: board._id,
            isArchived: { $ne: true }
          });
          return { ...board, cardCount };
        })
      );

      res.json(boardsWithCounts);
    } catch (error) {
      console.error('Error in getBoards:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createBoard(req, res) {
    try {
      const { title, description } = req.body;

      const board = new Board({
        userId: req.user._id,
        title,
        description,
        columns: [
          { id: 'todo', title: 'To Do', color: 'bg-gray-100', emoji: '📋', order: 0 },
          { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50', emoji: '⚡', order: 1 },
          { id: 'done', title: 'Done', color: 'bg-green-50', emoji: '✅', order: 2 }
        ]
      });

      await board.save();
      res.status(201).json(board);
    } catch (error) {
      console.error('Error in createBoard:', error);
      res.status(400).json({ message: error.message });
    }
  }
  

  async getBoard(req, res) {
    try {
      const board = await Board.findOne({
        _id: req.params.id,
        userId: req.user._id,
        isArchived: { $ne: true }
      });

      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }

      const cards = await Card.find({
        boardId: board._id,
        isArchived: { $ne: true }
      }).sort({ order: 1 });

      res.json({ board, cards });
    } catch (error) {
      console.error('Error in getBoard:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateBoard(req, res) {
    try {
      const { title, description, settings } = req.body;
      const board = await Board.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { title, description, settings },
        { new: true }
      );

      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }

      res.json(board);
    } catch (error) {
      console.error('Error in updateBoard:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async updateBoardColumns(req, res) {
    try {
      const { columns } = req.body;
      
      // Validate columns structure
      if (!Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ message: 'Invalid columns data' });
      }

      const board = await Board.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: { columns } },
        { new: true }
      );

      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }

      res.json(board);
    } catch (error) {
      console.error('Error in updateBoardColumns:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async deleteBoard(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const board = await Board.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isArchived: true },
        { session }
      );

      if (!board) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Board not found' });
      }

      // Archive all cards in the board
      await Card.updateMany(
        { boardId: board._id },
        { isArchived: true },
        { session }
      );

      await session.commitTransaction();
      res.json({ message: 'Board archived successfully' });
    } catch (error) {
      await session.abortTransaction();
      console.error('Error in deleteBoard:', error);
      res.status(500).json({ message: 'Server error' });
    } finally {
      session.endSession();
    }
  }

  // Card Operations
  async getCards(req, res) {
    try {
      const { boardId } = req.query;
      const query = {
        userId: req.user._id,
        isArchived: { $ne: true }
      };

      if (boardId) {
        query.boardId = boardId;
      }

      const cards = await Card.find(query).sort({ order: 1 });
      res.json(cards);
    } catch (error) {
      console.error('Error in getCards:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getCard(req, res) {
    try {
      const card = await Card.findOne({
        _id: req.params.id,
        userId: req.user._id,
        isArchived: { $ne: true }
      });
  
      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }
  
      res.json(card);
    } catch (error) {
      console.error('Error in getCard:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createCard(req, res) {
    try {
      const { boardId, columnId } = req.body;

      // Get the highest order in the column
      const maxOrderCard = await Card.findOne({
        boardId,
        columnId,
        isArchived: { $ne: true }
      }).sort({ order: -1 });

      const order = maxOrderCard ? maxOrderCard.order + 1 : 0;

      const card = new Card({
        ...req.body,
        userId: req.user._id,
        order
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
      const card = await Card.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true }
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

  async updateCardPosition(req, res) {
    try {
      const { columnId, order } = req.body;
      const card = await Card.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
  
      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }
  
      // Store the original values
      const originalColumnId = card.columnId;
      const originalOrder = card.order;
  
      // Update orders of other cards first
      if (columnId === originalColumnId) {
        // Same column reordering
        await Card.updateMany(
          {
            boardId: card.boardId,
            columnId: columnId,
            order: { $gte: order },
            _id: { $ne: card._id }
          },
          { $inc: { order: 1 } }
        );
      } else {
        // Moving to different column
        // Decrease orders in original column
        await Card.updateMany(
          {
            boardId: card.boardId,
            columnId: originalColumnId,
            order: { $gt: originalOrder }
          },
          { $inc: { order: -1 } }
        );
  
        // Increase orders in target column
        await Card.updateMany(
          {
            boardId: card.boardId,
            columnId: columnId,
            order: { $gte: order }
          },
          { $inc: { order: 1 } }
        );
      }
  
      // Update the moved card
      card.columnId = columnId;
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
      const card = await Card.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { tasks },
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
      const card = await Card.findOneAndUpdate(
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
      const label = decodeURIComponent(req.params.label);
      const card = await Card.findOneAndUpdate(
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

  async deleteCard(req, res) {
    try {
      const card = await Card.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isArchived: true }
      );

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      res.json({ message: 'Card archived successfully' });
    } catch (error) {
      console.error('Error in deleteCard:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new KanbanController();