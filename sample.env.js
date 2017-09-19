// this file mirrors the contents of .env.js

module.exports = {
  verbosity: Number,
    // 0: anything
    // 1: - minor function calling
    // 2: - major function calling
    // 3: - connection
    // 4: - hooks
    // 5: only fatal
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
  },

  encodeId: Function, // database id → public id
  decodeId: Function, // public id → database id
}
