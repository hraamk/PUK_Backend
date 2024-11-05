const projectService = require('../services/projectService');

class ProjectController {
    async createProject(req, res) {
        try {
            // Input validation
            if (!req.body) {
                return res.status(400).json({
                    message: 'Request body is missing'
                });
            }

            // Debug logging
            console.log('Received request body:', req.body);

            // Call service layer
            const newProject = await projectService.createProject(req.body);
            res.status(201).json(newProject);
        } catch (error) {
            console.error('Error creating project:', error);
            res.status(500).json({
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async getAllProjects(req, res) {
        try {
            const projects = await projectService.getAllProjects();
            res.json(projects);
        } catch (error) {
            console.error('Error fetching Projects:', error);
            res.status(500).json({
                message: error.message
            });
        }
    }
}

module.exports = new ProjectController();
