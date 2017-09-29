const knex = require('./db');
const log = require('./log');
const MC = require('maptor-consumer');

const exists = (table, where) => {
  return knex(table)
    .select(Object.keys(where)[0]) // minimize strain on both node and db
    .where(where)
    .then((propertyObjects) => propertyObjects.length > 0);
}

const fetchers = {
  user: {
    idExists({ id }) {
      return exists('users', { id });
    },
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
    getBasic({ id }) {
      return knex('users')
        .select([
          'profile_url',
          'name'
        ])
        .where({ id })
        .then(( [data] ) => MC.map(data, {
          profileUrl: 'profile_url',
          name: 1
        }))
    },
    getPublic({ id }) {
      return knex('users')
        .select([
          'profile_url',
          'description',
          'follower_count',
          'following_count',
          'name'
        ])
        .where({ id })
        .then(([ data ]) => MC.map(data, {
          profileUrl: 'profile_url',
          description: 1,
          followerCount: 'follower_count',
          followingCount: 'following_count',
          name: 1
        }));
    },
    getRelationships({ originId, targetId }) {
      return knex('user_relationsips')
          .select('type')
          .where({ origin_id: originId, target_id: targetId })
          .then((data) => {
            const res = {};
            
            for(let { type } of data) {
              res[type] = true;
            };

            return res;
          })
    },
    getRelationship({ originId, targetId, relationship }) {
      return exists('user_relationships', {
          origin_id: originId,
          taget_id: targetId,
          type: relationship
        })
    }

  },
  twat: {
    idExists({ id }) {
      return exists('twats', { id });
    },
    getPublic({ id }) {
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
          fetchers.user.getBasic({ id: data.author_id })
            .then((author) => { 
              resolve({ ...data, author });
            })
        }))
        .then((data) => MC.map(data, {
          content: 1,
          twatbackCount: 'twatback_count',
          shoutCount: 'shout_count',
          responseCount: 'response_count',
          parentId: 'parent_id',
          authorId: 'author_id',
          author: {
            profileUrl: 1,
            name: 1
          }
        }))
    },
    getTimeline({ id, offset, count }) {
      return knex('twats')
        .join('user_relationships', {
          'target_id': 'twats.author_id',
          'type': knex.raw("'following'")
        })
        .select([
          'id',
          'content',
          'twatback_count',
          'shout_count',
          'response_count',
          'parent_id'
        ])
        .limit(count)
        .offset(offset)
        .then((data) => MC.map(data, [{
          id: 1,
          content: 1,
          twatbackCount: 'twatback_count',
          shoutCount: 'shout_count',
          responseCount: 'response_count',
        }]))
    },
    getPublicByAuthor({ id, offset, count }) {
      return knex('twats')
        .select([
          'id',
          'content',
          'twatback_count',
          'shout_count',
          'response_count',
          'parent_id'
        ])
        .where({ 'author_id': id })
        .orderBy('created_at')
        .limit(count)
        .offset(offset)
        .then((data) => MC.map(data, [{
          id: 1,
          content: 1,
          twatbackCount: 'twatback_count',
          shoutCount: 'shout_count',
          responseCount: 'response_count',
          parentId: 'parent_id'
        }]))
    }
  }
}

module.exports = fetchers;
