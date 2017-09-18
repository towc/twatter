const knex = require('./db');
const log = require('./log');

const exists = (table, where) => {
  return knex(table)
    .select(Object.keys(where)[0]) // minimize strain on both node and db
    .where(where)
    .then((propertyObjects) => propertyObjects.length > 0);
}

const fetchers = {
  user: {
    getIdFromName({ name }) {
      return knex('users')
        .select('id')
        .where({ name })
        .then(([{ id }]) => id)
    },
    nameExists({ name }) {
      return exists('users', { name })
    },
    hashFromName({ name }) {
      return knex('users')
        .select('hash')
        .where({ name })
        .then(([{ hash }]) => hash)
    },
    getBasicById({ id }) {
      return knex('users')
        .select([
          'profile_url',
          'name'
        ])
        .where({ id })
        .then(( [data] ) => data)
    },
    getPublicByName({ name }) {
      return knex('users')
        .select([
          'profile_url',
          'description',
          'follower_count',
          'following_count'
        ])
        .where({ name })
        .then(([ data ]) => data)
    },
    getRelationshipsFromIdToName({ originId, targetName }) {
      return fetchers.user.getIdFromName({ name: targetName })
        .then((targetId) => knex('user_relationsips')
            .select('type')
            .where({ origin_id: originId, target_id: targetId })
        )
    },
    getRelationshipFromNameToId({ originName, targetId, relationship }) {
      return fetchers.user.getIdFromName({ name: originName })
        .then((originId) => exists('user_relationships', {
          origin_id: originId,
          taget_id: targetId,
          type: relationship
        }))
    }

  },
  twat: {
    idExists({ id }) {
      return exists('twats', { id });
    },
    getPublicById({ id }) {
      return knex('twats')
        .select([
          'content',
          'twatback_count',
          'shout_count',
          'response_count',
          'parent_id',
          'author_id'
        ])
        .where({ id })
        .then(([ data ]) => new Promise((resolve) => {
          fetchers.user.getBasicById({ id: data.author_id })
            .then((author) => { 
              delete data.author_id;
              resolve({ ...data, author });
            })
        }))
    },
    getTimelineById({ id, offset, count }) {
      return knex('twats')
        .join('user_relationships', {
          'target_id': 'twats.author_id',
          'type': knex.raw("'following'")
        })
        .select([
          'content',
          'twatback_count',
          'shout_count',
          'response_count',
          'parent_id'
        ])
    },
    getPublicByAuthorName({ name, offset, count }) {
      return knex('twats')
        .join('users', {
          'twats.author_id': 'users.id',
        })
        .select([
          'twats.id',
          'content',
          'twatback_count',
          'twats.shout_count',
          'response_count',
          'parent_id'
        ])
        .where({ 'users.name': name })
        .orderBy('twats.created_at')
        .limit(count)
        .offset(offset);
    }
  }
}

module.exports = fetchers;
