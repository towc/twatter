const knex = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {

  // with side effects
  createUser({ name, password }) {
    return bcrypt.hash(password, saltRounds).then((hash) => {
      return knex('users')
        .insert({ name, hash });
    }); 
  },

  modifyUser({ id, name, password, profileUrl, description }) {
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

  createTwat({ content, authorId, parentId }) {
    return knex('twats')
      .insert({ 
        content, 
        author_id: authorId, 
        parent_id: parentId === undefined ? null : parentId
      })
  },

  // no side effects
  getIdFromName({ name }) {
    return knex('users')
      .select('id')
      .where({ name })
      .then((ids) => ids[0]);
  }
}
