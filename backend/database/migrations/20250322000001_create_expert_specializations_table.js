exports.up = function(knex) {
  return knex.schema.createTable('expert_specializations', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('category_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // 添加外键约束
    table.foreign('user_id').references('users.id');
    table.foreign('category_id').references('categories.id');
    
    // 添加唯一约束，确保同一用户和分类的组合不会重复
    table.unique(['user_id', 'category_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('expert_specializations');
}; 