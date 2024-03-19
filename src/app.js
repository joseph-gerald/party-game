const express = require('express');
const path = require('path');

const app = express();
const router = require('./routes');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);

module.exports = app;