module.exports = ({ id }) => ({
  user: {
    loginData: {
      id
    },
    base: {
      profileUrl: String,
      description: String,
      followerCount: Number,
      followingCount: Number,
      name: String
    }
  },

  twat: {
    base: {
      id,
      content: String,
      twatbackCount: Number,
      shoutCount: Number,
      responseCount: Number,
      parentId: id,
      author: {
        id,
        profileUrl: String,
        description: String,
        followerCount: Number,
        followingCount: Number,
        name: String
      }
    },
    timeline: [{
      id,
      content: String,
      twatbackCount: Number,
      shoutCount: Number,
      responseCount: Number,
      parentId: id,
      author: {
        id,
        profileUrl: String,
        description: String,
        followerCount: Number,
        followingCount: Number,
        name: String
      }
    }],
    publicByAuthor: [{
      id,
      content: String,
      twatbackCount: Number,
      shoutCount: Number,
      responseCount: Number,
      parentId: id,
      author: {
        id,
        profileUrl: String,
        description: String,
        followerCount: Number,
        followingCount: Number,
        name: String
      }
    }]
  }
});
