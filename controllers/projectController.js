const projectService = require('../services/projectService');

class ProjectController {
    async createProject(req, res) {
        try {
            if (!req.body) {
                return res.status(400).json({
                    message: 'Request body is missing'
                });
            }

            console.log('Received request body:', req.body);
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
            console.error('Error fetching projects:', error);
            res.status(500).json({
                message: error.message
            });
        }
    }

    async getProjectById(req, res) {
        try {
            const project = await projectService.getProjectById(req.params.id);
            res.json(project);
        } catch (error) {
            if (error.message === 'Project not found') {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: error.message });
            }
        }
    }

    async updateProject(req, res) {
        try {
            const updatedProject = await projectService.updateProject(req.params.id, req.body);
            res.json(updatedProject);
        } catch (error) {
            if (error.message === 'Project not found') {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: error.message });
            }
        }
    }

    async deleteProject(req, res) {
        try {
            await projectService.deleteProject(req.params.id);
            res.status(204).send();
        } catch (error) {
            if (error.message === 'Project not found') {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: error.message });
            }
        }
    }
}

module.exports = new ProjectController();