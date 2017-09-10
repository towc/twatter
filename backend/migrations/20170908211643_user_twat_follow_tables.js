
exports.up = function(knex, Promise) {
  
  return knex.schema
    .createTable('users', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.string('name').unique();
      table.string('hash');
      table.string('profileUrl').defaultTo('/assets/images/default-profile.png');
      table.string('description').defaultTo('Recently joined twatter!');
      table.integer('follower_count').defaultTo(0);
      table.integer('following_count').defaultTo(0);
    })
    .createTable('follow_relationships', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.integer('follower_id').references('users.id');
      table.integer('followed_id').references('users.id');
    })
    .createTable('twats', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.string('content');
      table.integer('twatback_count').defaultTo(0);
      table.integer('response_count').defaultTo(0);
      table.integer('parent_id').references('twats.id');
      table.integer('author_id').references('users.id');
    })
};

exports.down = function(knex, Promise) {
  
  return knex.schema
    .dropTable('twats')
    .dropTable('follow_relationships')
    .dropTable('users')
};
