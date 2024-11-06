// routes/documents.js
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Base CRUD operations
router.post('/', documentController.createDocument.bind(documentController));
router.get('/', documentController.getUserDocuments.bind(documentController));
router.get('/:id', documentController.getDocument.bind(documentController));
router.put('/:id', documentController.updateDocument.bind(documentController));
router.delete('/:id', documentController.deleteDocument.bind(documentController));

module.exports = router;