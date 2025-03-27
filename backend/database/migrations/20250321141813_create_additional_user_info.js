exports.up = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('gender');
    table.string('phone');
    table.string('expertise');
    table.text('favorites'); // store JSON.stringify'd array
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('gender');
    table.dropColumn('phone');
    table.dropColumn('expertise');
    table.dropColumn('favorites');
  });
};
