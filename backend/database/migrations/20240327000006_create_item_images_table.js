exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('item_images');
  
  if (!hasTable) {
    return knex.schema.createTable('item_images', table => {
      table.increments('id').primary();
      table.integer('item_id')
        .references('id')
        .inTable('items')
        .onDelete('CASCADE')
        .notNullable();
      table.string('image_url').notNullable();
      table.integer('display_order').defaultTo(0);
      table.timestamps(true, true);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('item_images');
};