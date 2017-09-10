const knex = require('knex')({...require('./knexfile'), debug: true});

module.exports = knex;
