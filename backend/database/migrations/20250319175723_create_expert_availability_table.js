exports.up = function (knex) {
    return knex.schema.createTable('expert_availability', (table) => {
        table.increments('id').primary();
        table.integer('expert_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.date('date').notNullable(); // Specific day (YYYY-MM-DD)
        table.time('start_time').notNullable(); // Start time (HH:MM:SS)
        table.time('end_time').notNullable(); // End time (HH:MM:SS)
        table.boolean('is_available').notNullable().defaultTo(true); // 1 = Available, 0 = Unavailable
        table.date('week_start_date').notNullable(); // The Sunday of the week this slot belongs to

        table.unique(['expert_id', 'date', 'start_time', 'end_time']); // Prevent duplicate time slots
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('expert_availability');
};
