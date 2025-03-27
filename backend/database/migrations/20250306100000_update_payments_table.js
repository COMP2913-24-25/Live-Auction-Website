exports.up = function(knex) {
  return knex.schema.table('payments', function(table) {
    if (!knex.schema.hasColumn('payments', 'payment_method_id')) {
      table.integer('payment_method_id').unsigned().references('id').inTable('user_payment_methods').onDelete('SET NULL');
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('payments', function(table) {
    table.dropColumn('payment_method_id');
  });
}; 