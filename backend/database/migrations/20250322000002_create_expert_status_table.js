exports.up = function(knex) {
  return knex.schema.createTable('expert_status', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.enum('status', ['Available', 'Busy', 'Away']).defaultTo('Available');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // 添加外键约束
    table.foreign('user_id').references('users.id');
    
    // 添加唯一约束，确保每个用户只有一个状态记录
    table.unique(['user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('expert_status');
}; 