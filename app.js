const express = require('express');
const app = express();

app.get('/', function(req,res) {
    res.send('Hello Spaces');
});

app.listen(9000, function(req,res) {
    console.log('Server is running on port 9000');
});