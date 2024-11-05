const express = require('express')
const mongoose = require('mongoose')
const url = 'mongodb+srv://user:user@spaces..mongodb.net/?retryWrites=true&w=majority&appName=Spaces'
const cors = require('cors')

const app = express();

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

const spaceRouter = require('./routes/spaces')
app.use('/spaces', spaceRouter)

app.listen(9000, function(){
    console.log('Server started')
})