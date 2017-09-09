const env = require('./../.env');

module.exports = {
  client: env.db.type,
  connection: {
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database
  }
}
