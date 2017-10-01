module.exports = ({ id, error }) => {

  // If there's no x, keep not having an x. Otherwise, pass it through the function
  // This is to circumvent behaviour like `String(undefined) === 'undefined'`
  const optional = (fn) => (x) => x === undefined ? undefined : fn(x);
  
  // If there's no x, it was a bad request
  const required = (fn) => (x, name) => x === undefined ? error(x, name) : fn(x)

  const list = {
    offset: required(String),
    count: required(String)
  }
  
  return {
    user: {
      identifier: {
        id: required(id)
      },
      authIdentifier: {
        name: required(String),
        password: required(String)
      },
      edit: {
        name: optional(String),
        password: optional(String),
        profileUrl: optional(String),
        description: optional(String)
      },
      changeRelationship: {
        targetId: required(id),
        following: optional(Boolean),
        blocking: optional(Boolean),
        muting: optional(Boolean)
      },
    },

    twat: {
      identifier: {
        id: required(id)
      },
      create: {
        content: String,
        parentId: optional(id)
      },
      list: {
        ...list
      },
      listByAuthor: {
        ...list,
        id: required(id)
      }
    }
  }
}
