exports.up = async function(knex) {
  // 首先检查表是否存在
  const tableExists = await knex.schema.hasTable('authentication_requests');
  
  if (!tableExists) {
    // 只有在表不存在时才创建
    return knex.schema.createTable('authentication_requests', table => {
      table.increments('id');
      table.integer('user_id').notNullable().references('id').inTable('users');
      table.integer('item_id').notNullable().references('id').inTable('items');
      table.integer('expert_id').nullable().references('id').inTable('users');
      table.string('status').notNullable().defaultTo('Pending');
      table.text('notes');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  } else {
    console.log('表 authentication_requests 已存在，跳过创建');
    // 检查表中是否缺少某些列，如果需要可以在这里添加列
    return Promise.resolve();
  }
};

exports.down = function(knex) {
  // 回滚时仍然尝试删除表，如果存在的话
  return knex.schema.dropTableIfExists('authentication_requests');
}; 