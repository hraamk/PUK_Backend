const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/', projectController.createProject.bind(projectController));
router.get('/', projectController.getAllProjects.bind(projectController));

module.exports = router;