const Project = require('../models/project');

class ProjectRepository {
    async create(projectData) {
        try {
            const project = new Project(projectData);
            return await project.save();
        } catch (error) {
            throw error;
        }
    }

    async findAll() {
        try {
            return await Project.find();
        } catch (error) {
            throw error;
        }
    }

    async findById(id) {
        try {
            return await Project.findById(id);
        } catch (error) {
            throw error;
        }
    }

    async update(id, projectData) {
        try {
            return await Project.findByIdAndUpdate(id, projectData, { new: true });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            return await Project.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProjectRepository();