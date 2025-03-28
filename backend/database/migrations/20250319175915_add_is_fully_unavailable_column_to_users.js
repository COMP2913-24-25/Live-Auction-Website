exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.boolean('is_fully_unavailable').defaultTo(false);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropColumn('is_fully_unavailable');
    });
};
