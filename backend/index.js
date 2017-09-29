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

const apiPaths = {
  'post /user': handlers.user.create,
  'post /user/login': handlers.user.login,
  'post /user/edit': handlers.user.edit,
  'post /user/relationship/:id': handlers.user.changeRelationship,
  'get /user/base/:id': handlers.user.getBase,

  'post /twat': handlers.twat.create,
  'get /twat/:id': handlers.twat.getBase,
  'get /twat/timeline/:offset+:count': handlers.twat.getTimeline,
  'get /twat/by-author/:id/:offset+:count': handlers.twat.getPublicByAuthor
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
