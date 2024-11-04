const express = require('express')
const mongoose = require('mongoose')
const url = 'mongodb+srv://user:user@spaces.pkccu.mongodb.net/?retryWrites=true&w=majority&appName=Spaces'

const app = express();

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