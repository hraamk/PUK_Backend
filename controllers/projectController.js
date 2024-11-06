// controllers/projectController.js
const Project = require('../models/project');

class ProjectController {
  // Create a new project
  async createProject(req, res) {
    try {
      console.log('Received project data:', req.body); // Debug log

      const projectData = {
        name: req.body.name,
        description: req.body.description,
        spaces: req.body.spaces,
        userId: req.user._id,
        progress: req.body.progress || 0,
        members: req.body.members || 1,
        status: req.body.status || 'active'
      };

      console.log('Processed project data:', projectData); // Debug log

      const project = new Project(projectData);
      const savedProject = await project.save();

      console.log('Saved project:', savedProject); // Debug log

      res.status(201).json(savedProject);
    } catch (error) {
      console.error('Project creation error:', error);
      
      // Handle different types of errors
      if (error.code === 11000) {
        return res.status(400).json({
          message: 'Duplicate key error',
          details: error.keyPattern
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(400).json({
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
      });
    }
  }

  // Get all projects for a user
  async getUserProjects(req, res) {
    try {
      const projects = await Project.find({ userId: req.user._id });
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get a specific project
  async getProject(req, res) {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update a project
  async updateProject(req, res) {
    try {
      // Remove fields that shouldn't be updated directly
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.userId;

      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        updateData,
        { 
          new: true, // Return the updated document
          runValidators: true // Run model validations on update
        }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Project update error:', error);
      res.status(400).json({ 
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
      });
    }
  }

  // Delete a project
  async deleteProject(req, res) {
    try {
      const project = await Project.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update project progress
  async updateProgress(req, res) {
    try {
      const { progress } = req.body;
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: 'Invalid progress value' });
      }

      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { progress },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Add activity to project
  async addActivity(req, res) {
    try {
      const { space, name } = req.body;
      if (!space || !name) {
        return res.status(400).json({ message: 'Space and name are required for activity' });
      }

      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { 
          $push: { 
            recentActivities: {
              space,
              name,
              updated: new Date()
            }
          }
        },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Update project members
  async updateMembers(req, res) {
    try {
      const { members } = req.body;
      if (typeof members !== 'number' || members < 1) {
        return res.status(400).json({ message: 'Invalid members value' });
      }

      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { members },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new ProjectController();