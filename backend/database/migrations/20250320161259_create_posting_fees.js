exports.up = function(knex) {
    return knex.schema.createTable('posting_fees', table => {
        table.decimal('fixedFee', 10, 2).notNullable();
        table.decimal('tier1Percentage', 5, 2).notNullable();
        table.decimal('tier2Percentage', 5, 2).notNullable();
        table.decimal('tier3Percentage', 5, 2).notNullable();
        table.decimal('tier1Max', 10, 2).notNullable();
        table.decimal('tier2Max', 10, 2).notNullable();
        table.decimal('tier3Max', 10, 2).notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('posting_fees');
};