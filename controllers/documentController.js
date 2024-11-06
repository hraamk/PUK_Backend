// controllers/documentController.js
const Document = require('../models/document');

class DocumentController {
  // Create a new document
  async createDocument(req, res) {
    try {
      console.log('Received document data:', req.body); // Debug log

      const documentData = {
        title: req.body.title || 'Untitled',
        content: req.body.content || '',
        plainText: req.body.plainText || '',
        owner: req.user._id,
        wordCount: req.body.wordCount || 0
      };

      console.log('Processed document data:', documentData); // Debug log

      const document = new Document(documentData);
      const savedDocument = await document.save();

      console.log('Saved document:', savedDocument); // Debug log

      res.status(201).json(savedDocument);
    } catch (error) {
      console.error('Document creation error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(400).json({ message: error.message });
    }
  }

  // Get all documents for a user
  async getUserDocuments(req, res) {
    try {
      const documents = await Document.find({ owner: req.user._id })
        .select('title wordCount lastModified createdAt')
        .sort({ lastModified: -1 });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get a specific document
  async getDocument(req, res) {
    try {
      const document = await Document.findOne({
        _id: req.params.id,
        owner: req.user._id
      });

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update a document
  async updateDocument(req, res) {
    try {
      const { title, content, plainText } = req.body;
      const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

      const updates = {
        ...(title && { title }),
        ...(content && { content }),
        ...(plainText && { plainText }),
        wordCount,
        lastModified: new Date()
      };

      const document = await Document.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        updates,
        { new: true, runValidators: true }
      );

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Document update error:', error);
      res.status(400).json({ 
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
      });
    }
  }

  // Delete a document
  async deleteDocument(req, res) {
    try {
      const document = await Document.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id
      });

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new DocumentController();