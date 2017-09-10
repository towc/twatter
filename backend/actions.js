const knex = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {

  user: {
    create({ name, password }) {
      return bcrypt.hash(password, saltRounds).then((hash) => {
        return knex('users')
          .insert({ name, hash });
      }); 
    },

    modify({ id, name, password, profileUrl, description }) {
      let updateObject = { name, profileUrl, description };

      for(let key in updateObject) {
        if(updateObject[key] === undefined) {
          delete updateObject[key];
        }
      }

      const query = knex('users').where({ id });

      if(password) {
        return bcrypt.hash(password, saltRounds).then((hash) => {
          return query.update({ hash, ...updateObject });
        })
      }

      return query.update(updateObject);
    },
  },

  twat: {
    create({ content, authorId, parentId }) {
      return knex('twats')
        .insert({ 
          content, 
          author_id: authorId, 
          parent_id: parentId === undefined ? null : parentId
        })
    }
  },

}
