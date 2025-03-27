exports.up = function(knex) {
    return knex.schema.createTable('expert_categories', function(table) {
        table.integer('expert_id').unsigned().notNullable();
        table.integer('category_id').unsigned().notNullable();
        table.primary(['expert_id', 'category_id']);
        table.foreign('expert_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE');
    });
};
   
   exports.down = function(knex) {
        return knex.schema.dropTableIfExists('expert_categories');
};
   