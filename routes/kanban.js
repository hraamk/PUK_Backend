// routes/kanban.js
const express = require('express');
const router = express.Router();
const kanbanController = require('../controllers/kanbanController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Board Routes
router.get('/boards', kanbanController.getBoards);
router.post('/boards', kanbanController.createBoard);
router.get('/boards/:id', kanbanController.getBoard);
router.put('/boards/:id', kanbanController.updateBoard);
router.delete('/boards/:id', kanbanController.deleteBoard);
router.put('/boards/:id/columns', kanbanController.updateBoardColumns);

// Card Routes
router.get('/cards', kanbanController.getCards);
router.post('/cards', kanbanController.createCard);
router.get('/cards/:id', kanbanController.getCard);
router.put('/cards/:id', kanbanController.updateCard);
router.delete('/cards/:id', kanbanController.deleteCard);
router.put('/cards/:id/position', kanbanController.updateCardPosition);
router.put('/cards/:id/tasks', kanbanController.updateCardTasks);
router.post('/cards/:id/labels', kanbanController.addLabel);
router.delete('/cards/:id/labels/:label', kanbanController.removeLabel);

module.exports = router;