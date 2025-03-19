exports.up = function(knex) {
    return knex.schema.dropTableIfExists('notifications')
      .createTable('notifications', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable()
          .references('id').inTable('users').onDelete('CASCADE');
        table.integer('auction_id').unsigned()
          .references('id').inTable('items').onDelete('CASCADE');
        table.enum('type', ['outbid', 'won', 'ending_soon', 'ended']).notNullable();
        table.text('message').nullable();
        table.boolean('read').defaultTo(false);
        table.boolean('deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('notifications');
  };