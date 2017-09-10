module.exports = {
  name: {
    minLength: 1,
    maxLength: 20,
    charset: ['base alphabet', 'base special']
  },
  password: {
    minLength: 8,
    maxLength: 60,
    mustCharset: ['base lowercase', 'base uppercase']
  },
  profileUrl: {
    protocols: [ 'http', 'https' ],
    extensions: [ 'png', 'jpg', 'jpeg' ],
    maxLength: 240
  },
  description: {
    maxLength: 240,
    charset: ['base alphabet', 'extended special']
  }
}
