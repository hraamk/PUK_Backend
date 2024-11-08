// controllers/documentController.js
const Document = require('../models/document');

class DocumentController {
  // Create a new document
  async createDocument(req, res) {
    try {
      const documentData = {
        title: req.body.title || 'Untitled',
        content: req.body.content || '',
        plainText: req.body.plainText || '',
        owner: req.user._id,
        wordCount: req.body.wordCount || 0,
        tags: req.body.tags || [],
        status: req.body.status || 'draft'
      };

      const document = new Document(documentData);
      const savedDocument = await document.save();

      res.status(201).json(savedDocument);
    } catch (error) {
      console.error('Document creation error:', error);
      res.status(400).json({ 
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
      });
    }
  }

  // Get all documents for a user
  async getUserDocuments(req, res) {
    try {
      const documents = await Document.find({ owner: req.user._id })
        .select('title content plainText wordCount lastModified createdAt tags status')
        .sort({ lastModified: -1 });

      res.json(documents);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Get a specific document
  async getDocument(req, res) {
    try {
      const document = await Document.findOne({
        _id: req.params.id,
        owner: req.user._id
      }).select('title content plainText wordCount lastModified createdAt tags status');

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Update a document
  async updateDocument(req, res) {
    try {
      const { title, content, plainText, tags, status } = req.body;
      const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

      const updates = {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(plainText !== undefined && { plainText }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && { status }),
        wordCount,
        lastModified: new Date()
      };

      const document = await Document.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        updates,
        { new: true, runValidators: true }
      ).select('title content plainText wordCount lastModified createdAt tags status');

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
      
      res.json({ 
        message: 'Document deleted successfully',
        documentId: document._id
      });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Auto-save a document
  async autoSaveDocument(req, res) {
    try {
      console.log('Auto-save request received:', {
        documentId: req.params.id,
        contentLength: req.body.content?.length
      });

      const { content, plainText } = req.body;
      const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

      const updates = {
        content,
        plainText,
        wordCount,
        lastModified: new Date()
      };

      const document = await Document.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        updates,
        { new: true, runValidators: true }
      ).select('title content plainText wordCount lastModified createdAt tags status');

      if (!document) {
        console.log('Document not found for auto-save:', req.params.id);
        return res.status(404).json({ message: 'Document not found' });
      }

      console.log('Document auto-saved successfully:', {
        id: document._id,
        wordCount: document.wordCount
      });

      res.json(document);
    } catch (error) {
      console.error('Auto-save error:', error);
      res.status(400).json({ 
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
      });
    }
  }
}

module.exports = new DocumentController();