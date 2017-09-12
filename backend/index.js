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
  cookie: { secure: env.session.cookieSecure },
  resave: false,
  saveUninitialized: false
}));
expressApp.use(expressBodyParser.json());

expressApi.get('/', (req, res) => {
  res.send(Math.random() + ' hello')
});

const apiPaths = {
  'post /user': handlers.user.create,
  'post /user/login': handlers.user.login,
  'post /user/edit': handlers.user.edit,
  'post /user/relationship/:name': handlers.user.changeRelationship,
  'get /user/by-name/base/:name': handlers.user.getByNameBase,

  'post /twat': handlers.twat.create,
  'get /twat/by-id/:id': handlers.twat.getById,
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
  log(`App listening on ${env.port}`, { verbosity: 3 });
})
