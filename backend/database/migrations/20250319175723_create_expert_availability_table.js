exports.up = function (knex) {
    return knex.schema.createTable('expert_availability', (table) => {
        table.increments('id').primary();
        table.integer('expert_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.date('date').notNullable(); // Specific day (YYYY-MM-DD)
        table.time('start_time').defaultTo("08:00"); // Start time (HH:MM:SS)
        table.time('end_time').defaultTo("08:00"); // End time (HH:MM:SS)
        table.boolean('unavailable').notNullable().defaultTo(true); // 1 = Unavailable, 0 = Available

        table.unique(['expert_id', 'date']); // Ensure that an expert can only have one availability per day
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('expert_availability');
};
