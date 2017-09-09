const path = require('path');
const express = require('express');
const api = express.Router();
const app = express();

const env = require('./../.env');
const db = require('./db');
const log = (message, type) => console.log(new Date, message);

api.get('/', (req, res) => {
  res.send(Math.random() + ' hello')
})

app.use('/api', api);
app.use(express.static(path.join(__dirname, 'assets')));

app.listen(env.port, () => {
  log(`App listening on ${env.port}`);
})
