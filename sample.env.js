// this file mirrors the contents of .env.js

module.exports = {
  port: Number,
  db: {
    type: String,
    host: String,
    user: String,
    password: String,
    database: String 
  },
  session: {
    cookieSecret: String,
    cookieSecure: Boolean
  }
}
