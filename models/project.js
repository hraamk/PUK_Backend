const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    project: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    updated: {
        type: String,
        required: true
    }
});

const projectSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    projects: {
        type: [String],
        required: true,
        validate: {
            validator: function(array) {
                return array.length > 0;
            },
            message: 'Projects array must contain at least one project'
        }
    },
    progress: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    members: {
        type: Number,
        required: true,
        min: 0
    },
    recentActivities: {
        type: [activitySchema],
        default: []
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Project', projectSchema);