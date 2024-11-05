const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 9000;

// CORS Configuration
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
})
.then(() => {
    console.log('MongoDB Connected Successfully');
    // List all collections after successful connection
    mongoose.connection.db.listCollections().toArray()
        .then(collections => {
            console.log('Available collections:', collections.map(c => c.name));
        });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB...');
});

// Test route for database status
app.get('/api/status', async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json({
            database: {
                connected: mongoose.connection.readyState === 1,
                name: mongoose.connection.name,
                collections: collections.map(c => c.name)
            },
            server: {
                port: port,
                environment: process.env.NODE_ENV
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Import routes
const authRoutes = require('./routes/auth');
const projectRouter = require('./routes/projects');

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRouter); // Changed to /api/projects for consistency

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI.split('@')[1]}`); // Logs URI without credentials
});

module.exports = app;