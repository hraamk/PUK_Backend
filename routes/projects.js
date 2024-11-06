// routes/projects.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Base CRUD operations
router.post('/', projectController.createProject.bind(projectController));
router.get('/', projectController.getUserProjects.bind(projectController));
router.get('/:id', projectController.getProject.bind(projectController));
router.put('/:id', projectController.updateProject.bind(projectController));
router.delete('/:id', projectController.deleteProject.bind(projectController));

// Additional operations
router.patch('/:id/progress', projectController.updateProgress.bind(projectController));
router.post('/:id/activities', projectController.addActivity.bind(projectController));
router.patch('/:id/members', projectController.updateMembers.bind(projectController));

module.exports = router;