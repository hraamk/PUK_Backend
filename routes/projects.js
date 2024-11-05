const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth, isAdmin } = require('../middleware/auth');

// Protect all routes with authentication
router.use(auth);

router.post('/', projectController.createProject.bind(projectController));
router.get('/', projectController.getAllProjects.bind(projectController));
router.get('/:id', projectController.getProjectById.bind(projectController));
router.put('/:id', projectController.updateProject.bind(projectController));
router.delete('/:id', projectController.deleteProject.bind(projectController));

router.get('/', projectController.getAllProjects.bind(projectController));
router.get('/:id', projectController.getProjectById.bind(projectController));

// Admin only routes
router.post('/', isAdmin, projectController.createProject.bind(projectController));
router.put('/:id', isAdmin, projectController.updateProject.bind(projectController));
router.delete('/:id', isAdmin, projectController.deleteProject.bind(projectController));


module.exports = router;