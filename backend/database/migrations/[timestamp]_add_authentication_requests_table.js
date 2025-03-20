exports.up = function(knex) {
  return knex.schema.createTable('authentication_requests', table => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').notNullable();
    table.integer('item_id').references('id').inTable('items').notNullable();
    table.integer('expert_id').references('id').inTable('users');
    table.string('status').notNullable().defaultTo('Pending');
    table.text('notes');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('authentication_requests');
}; 