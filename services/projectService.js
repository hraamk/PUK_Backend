const projectRepository = require('../repositories/projectRepository');

class ProjectService {
    async createProject(projectData) {
        try {
            const projectToCreate = {
                id: projectData.id,
                name: projectData.name,
                description: projectData.description,
                projects: projectData.projects,
                progress: projectData.progress,
                members: projectData.members,
                recentActivities: projectData.recentActivities || []
            };
            return await projectRepository.create(projectToCreate);
        } catch (error) {
            throw error;
        }
    }

    async getAllProjects() {
        try {
            return await projectRepository.findAll();
        } catch (error) {
            throw error;
        }
    }

    async getProjectById(id) {
        try {
            const project = await projectRepository.findById(id);
            if (!project) {
                throw new Error('Project not found');
            }
            return project;
        } catch (error) {
            throw error;
        }
    }

    async updateProject(id, projectData) {
        try {
            const updatedProject = await projectRepository.update(id, projectData);
            if (!updatedProject) {
                throw new Error('Project not found');
            }
            return updatedProject;
        } catch (error) {
            throw error;
        }
    }

    async deleteProject(id) {
        try {
            const deletedProject = await projectRepository.delete(id);
            if (!deletedProject) {
                throw new Error('Project not found');
            }
            return deletedProject;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProjectService();