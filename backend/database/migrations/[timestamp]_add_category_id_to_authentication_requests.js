exports.up = function(knex) {
  return knex.schema.table('authentication_requests', function(table) {
    // 检查列是否已存在
    knex.schema.hasColumn('authentication_requests', 'category_id')
      .then(function(exists) {
        if (!exists) {
          // 添加category_id列，并设置外键约束
          table.integer('category_id').references('id').inTable('categories');
          // 添加title和description列，如果表中也没有这些列
          if (!knex.schema.hasColumn('authentication_requests', 'title')) {
            table.string('title');
          }
          if (!knex.schema.hasColumn('authentication_requests', 'description')) {
            table.text('description');
          }
        }
      });
  });
};

exports.down = function(knex) {
  return knex.schema.table('authentication_requests', function(table) {
    // 移除添加的列
    table.dropColumn('category_id');
    // 如果有添加title和description，也一并移除
    if (knex.schema.hasColumn('authentication_requests', 'title')) {
      table.dropColumn('title');
    }
    if (knex.schema.hasColumn('authentication_requests', 'description')) {
      table.dropColumn('description');
    }
  });
}; 