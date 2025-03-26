/**
 * 创建专家数据表，存储专家用户的详细信息
 */
exports.up = function(knex) {
  return knex.schema.createTable('expert_data', table => {
    // 主键
    table.increments('id').primary();
    
    // 外键关联到users表
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // 专家显示名称
    table.string('display_name').notNullable();
    
    // 专家简介
    table.text('bio');
    
    // 专家头像URL
    table.string('avatar_url');
    
    // 时间戳
    table.timestamps(true, true);
    
    // 唯一约束确保每个用户只有一条专家数据记录
    table.unique('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('expert_data');
}; 