exports.up = function(knex) {
  return knex.schema.createTable('bid_confirmations', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('item_id').notNullable();
    table.float('bid_amount').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.boolean('confirmed').defaultTo(false);
    
    // 添加索引
    table.index(['user_id', 'item_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bid_confirmations');
}; 