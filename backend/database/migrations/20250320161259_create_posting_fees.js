exports.up = function(knex) {
    return knex.schema.createTable('posting_fees', table => {
        table.increments('id').primary();
        table.decimal('fixedFee', 10, 2).notNullable().defaultTo(1.00);
        table.decimal('tier1Percentage', 5, 2).notNullable().defaultTo(2.00);
        table.decimal('tier2Percentage', 5, 2).notNullable().defaultTo(3.00);
        table.decimal('tier3Percentage', 5, 2).notNullable().defaultTo(4.00);
        table.decimal('tier1Max', 10, 2).notNullable().defaultTo(100.00);
        table.decimal('tier2Max', 10, 2).notNullable().defaultTo(500.00);
        table.decimal('tier3Max', 10, 2).notNullable().defaultTo(1000.00);
        table.timestamps(true, true);
    }).then(() => {
        return knex('posting_fees').insert({
            id: 1,
            fixedFee: 1.00,
            tier1Percentage: 2.00,
            tier2Percentage: 3.00,
            tier3Percentage: 4.00,
            tier1Max: 100.00,
            tier2Max: 500.00,
            tier3Max: 1000.00
        });
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('posting_fees');
};