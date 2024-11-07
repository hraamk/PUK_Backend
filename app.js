const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path'); // Add this for production static files

// Load environment variables before anything else
dotenv.config();

const app = express();
const port = process.env.PORT;

// Initialize FND_URL with development URL
let FND_URL = process.env.FRONTEND_URL;

// Middleware to set FND_URL in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    FND_URL = `${req.protocol}://${req.get('host')}`;
  }
  next();
});

// Import routes
const projectRoutes = require('./routes/projects');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const kanbanRoutes = require('./routes/kanban');

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [FND_URL];
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:5173'); // Add Vite's default port
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with retry logic
const connectDB = async (retryCount = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected Successfully');
    
    // Drop the problematic index if it exists
    try {
      await mongoose.connection.db.collection('projects').dropIndex('id_1');
      console.log('Index dropped successfully');
    } catch (err) {
      if (err.code !== 27) { // Error code 27 means index not found
        console.error('Error dropping index:', err);
      }
    }
    
    console.log('Database setup completed');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (retryCount > 0) {
      console.log(`Retrying connection... (${retryCount} attempts remaining)`);
      setTimeout(() => connectDB(retryCount - 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      process.exit(1);
    }
  }
};

connectDB();

// Database connection event handlers
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
        environment: process.env.NODE_ENV,
        frontendUrl: FND_URL
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/kanban', kanbanRoutes);

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../PUK/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../PUK/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      message: err.message
    } : 'Internal server error'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // Only log part of MongoDB URI for security
  const sanitizedUri = process.env.MONGODB_URI.split('@')[1] || 'URI hidden for security';
  console.log(`MongoDB URI: ${sanitizedUri}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app;