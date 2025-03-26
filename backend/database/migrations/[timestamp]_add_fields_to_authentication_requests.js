/**
 * 为 authentication_requests 表添加 category_id、title 和 description 字段
 */
exports.up = function(knex) {
  return knex.schema.table('authentication_requests', table => {
    // 添加 category_id 外键
    table.integer('category_id').unsigned().references('id').inTable('categories');
    
    // 添加 title 字段
    table.string('title');
    
    // 添加 description 字段
    table.text('description');
  });
};

exports.down = function(knex) {
  return knex.schema.table('authentication_requests', table => {
    table.dropColumn('description');
    table.dropColumn('title');
    table.dropColumn('category_id');
  });
}; 