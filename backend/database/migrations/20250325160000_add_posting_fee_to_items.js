exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('items', 'posting_fee');
  if (!hasColumn) {
    return knex.schema.table('items', table => {
      table.decimal('posting_fee', 10, 2).defaultTo(0);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('items', table => {
    table.dropColumn('posting_fee');
  });
};