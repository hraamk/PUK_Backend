// models/project.js
const mongoose = require('mongoose');

const VALID_SPACES = [
  'scribe',
  'flow',
  'grid',
  'board',
  'calendar',
  'focus',
  'crm',
  'support',
  'knowledge'
];

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  spaces: [{
    type: String,
    required: true,
    enum: VALID_SPACES,
    set: v => v.toLowerCase()
  }],
  progress: {
    type: Number,
    default: 0
  },
  members: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  recentActivities: [{
    space: String,
    name: String,
    updated: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Remove any pre-existing indexes that might cause conflicts
projectSchema.indexes().forEach(index => {
  if (index[0].id) {
    projectSchema.index({ id: 1 }, { unique: false, sparse: true });
  }
});

const Project = mongoose.model('Project', projectSchema);

// Ensure indexes are properly set up
Project.createIndexes().catch(console.error);

module.exports = Project;