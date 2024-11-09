const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables before anything else
dotenv.config();


const app = express();
const port = process.env.PORT || 9000;

const projectRoutes = require('./routes/projects');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const kanbanRoutes = require('./routes/kanban');
const aiRoutes = require('./routes/ai');

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    try {
      // Parse the origin URL
      const requestOrigin = new URL(origin);
      
      // Allow if origin matches hostname with any port
      if (requestOrigin.hostname === 'localhost' || 
          requestOrigin.hostname === process.env.HOST || 
          requestOrigin.hostname === window.location.hostname) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    } catch (error) {
      callback(new Error('Invalid origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected Successfully');
    // Drop the problematic index if it exists
    return mongoose.connection.db.collection('projects').dropIndex('id_1')
      .catch(err => {
        if (err.code !== 27) { // Error code 27 means index not found
          console.error('Error dropping index:', err);
        }
      });
  })
  .then(() => {
    console.log('Database setup completed');
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


// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/ai', aiRoutes);

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




