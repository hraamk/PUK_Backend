const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

require('dotenv').config();
const url = process.env.MONGODB_URI;

const app = express();
const port = process.env.PORT || 9000;

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Assuming your React app runs on port 3000
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Enable credentials (cookies, authorization headers, etc)
  optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(url, {useNewUrlParser: true,})
const con = mongoose.connection;

con.on('open', function(){
    console.log('connected...')
})

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const projectRouter = require('./routes/projects')
app.use('/projects', projectRouter)

app.get

app.listen(port, function(){
    console.log('Server started')
})