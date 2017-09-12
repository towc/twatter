// this file mirrors the contents of .env.js

module.exports = {
  verbosity: Number, // the lower, the more verbose. Min is 0
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
