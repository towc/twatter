const knex = require('./db');

const exists = (table, where) => {
  const property = Object.keys(where)[0];
  const propertyValue = where[property];

  return knex(table)
    .select(property) // minimize strain on both node and db
    .where({ [property]: propertyValue })
    .then((propertyObjects) => propertyObjects.length > 0);
}

const propFromUnique = (table, property, where) =>
  knex(table)
    .select(property)
    .where(where)
    .then((propertyObjects) => propertyObjects[0][property]);

module.exports = {
  user: {
    getIdFromName({ name }) {
      return propFromUnique('users', 'id', { name });
    },
    nameExists({ name }) {
      return exists('users', { name })
    },
    hashFromName({ name }) {
      return propFromUnique('users', 'hash', { name });
    }
  },
  twat: {
    idExists({ id }) {
      return exists('twats', { id });
    }
  }
}
