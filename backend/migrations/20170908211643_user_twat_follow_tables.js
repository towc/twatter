
exports.up = function(knex, Promise) {
  
  return knex.schema
    .createTable('users', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.string('name').unique();
      table.string('hash');
      table.string('profile_url').defaultTo('/assets/images/default-profile.png');
      table.string('description').defaultTo('Recently joined twatter!');
      table.integer('follower_count').defaultTo(0);
      table.integer('following_count').defaultTo(0);
    })
    .createTable('user_relationships', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.enu('type', ['follow', 'block', 'mute']);
      table.integer('origin_id').references('users.id');
      table.integer('target_id').references('users.id');
    })
    .createTable('twats', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.string('content');
      table.integer('twatback_count').defaultTo(0);
      table.integer('shout_count').defaultTo(0);
      table.integer('response_count').defaultTo(0);
      table.integer('parent_id').references('twats.id');
      table.integer('author_id').references('users.id');
    })
    .createTable('user_twat_relationships', (table) => {
      table.increments();
      table.timestamps(false, true);
      table.enu('type', ['twatback', 'shout']);
      table.integer('origin_id').references('users.id');
      table.integer('target_id').references('twats.id');
    })
};

exports.down = function(knex, Promise) {
  
  return knex.schema
    .dropTable('user_twat_relationships')
    .dropTable('user_relationships')
    .dropTable('twats')
    .dropTable('users')
};
