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

    edit({ id, name, password, profileUrl, description }) {
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

    changeIdRelationshipsName({ relationships, originId, targetName })  {
      return fetchers.user.getIdFromName({ name: targetName })
        .then((targetId) => {
          const promises = [];
          for(let relationship in relationships) {
            const value = relationships[relationship];
            const relationshipObject = {
              origin_id: originId,
              target_id: targetId,
              type: relationship
            };

            promises.push(value ?
              knex('user_relationships')
                .insert(relationshipObject) :
              knex('user_relationships')
                .where(relationshipObject)
                .delete()
            );

            if(relationship === 'following') {
              promises.push(
                knex('users')
                  .where({ id: originId })
                  .increment('following_count', value ? 1 : -1 ),
                knex('users')
                  .where({ id: targetId })
                  .increment('follower_count', value ? 1 : -1 )
              )
            }
          }
        })
    }
  },

  twat: {
    create({ content, authorId, parentId }) {
      return knex('twats')
        .insert({ 
          content, 
          author_id: authorId, 
          parent_id: parentId === undefined ? null : parentId
        })
    },
  },

}
