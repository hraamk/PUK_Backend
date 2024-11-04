const express = require('express');
const router = express.Router();
const Space = require('../models/space');

// CREATE a space
router.post('/', async (req, res) => {
    try {
        // Debug logging
        console.log('Received request body:', req.body);
        
        // Check if request body exists
        if (!req.body) {
            return res.status(400).json({ 
                message: 'Request body is missing' 
            });
        }

        // Create new space with all fields from request body
        const space = new Space({
            id: req.body.id,
            name: req.body.name,
            description: req.body.description,
            spaces: req.body.spaces,
            progress: req.body.progress,
            members: req.body.members,
            recentActivities: req.body.recentActivities || []
        });

        const newSpace = await space.save();
        res.status(201).json(newSpace);
    } catch (err) {
        console.error('Error creating space:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// GET all spaces
router.get('/', async (req, res) => {
    try {
        const spaces = await Space.find();
        res.json(spaces);
    } catch (err) {
        console.error('Error fetching spaces:', err);
        res.status(500).json({ 
            message: err.message 
        });
    }
});

module.exports = router;