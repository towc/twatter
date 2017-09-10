const path = require('path');
const express = require('express');
const expressSession = require('express-session');
const expressBodyParser = require('body-parser')
const expressApi = express.Router();
const expressApp = express();

const env = require('./../.env');

const handlers = require('./handlers'); 

const log = require('./log');

expressApp.use(expressSession({
  secret: env.session.cookieSecret,
  cookie: { secure: env.session.cookieSecure }
}));
expressApp.use(expressBodyParser.json());

expressApi.get('/', (req, res) => {
  res.send(Math.random() + ' hello')
});

const apiPaths = {
  'post /user': handlers.userCreate,
  'post /user/login': handlers.userLogin,
  'post /user/modify': handlers.userModify
}
for(let key in apiPaths) {
  const [method, path] = key.split(' ');
  expressApi[method](path, apiPaths[key]);
}

expressApp.use('/api', expressApi);

const vuePaths = [
  '/',
  '/login',
  '/@:user'
];
expressApp.get(vuePaths, (req, res) => {
  res.sendFile(path.join(__dirname, 'assets/index.html'));
});
expressApp.use(express.static(path.join(__dirname, 'assets')));

expressApp.listen(env.port, () => {
  log(`App listening on ${env.port}`);
})
