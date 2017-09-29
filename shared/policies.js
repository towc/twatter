module.exports = {
  user: {
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
      charset: ['base alphabet', 'extended special', 'numeric decimal']
    }
  },

  twat: {
    content: {
      maxLength: 140,
      curses: [ 'twat' ]	
    },
    offset: {
      charset: ['numeric hex'],
      maxLength: 14
    },
    count: {
      max: 30,
      charset: ['numeric hex']
    }
  },

  session: {
    debounce: {
      userCreate: 10000
    }
  }
}
