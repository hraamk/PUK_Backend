const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    space: {
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

const spaceSchema = new mongoose.Schema({
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
    spaces: {
        type: [String],
        required: true,
        validate: {
            validator: function(array) {
                return array.length > 0;
            },
            message: 'Spaces array must contain at least one space'
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

module.exports = mongoose.model('Space', spaceSchema);