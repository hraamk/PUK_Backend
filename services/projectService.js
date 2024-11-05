const Project = require('../models/project');

class ProjectService {
    async createProject(projectData) {
        try {
            const project = new Project({
                id: projectData.id,
                name: projectData.name,
                description: projectData.description,
                projects: projectData.projects,
                progress: projectData.progress,
                members: projectData.members,
                recentActivities: projectData.recentActivities || []
            });
            return await project.save();
        } catch (error) {
            throw error;
        }
    }

    async getAllProjects() {
        try {
            return await Project.find();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProjectService();