exports.up = async function (knex) {
    await knex.schema.createTable('user_payment_methods', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('payment_provider', 50).notNullable(); // e.g., "Stripe", "PayPal"
        table.string('tokenized_card_id', 255).notNullable(); // Token from payment provider
        table.string('last4', 4).notNullable(); // Last 4 digits of the card
        table.string('card_type', 20).notNullable(); // e.g., "Visa", "MasterCard"
        table.integer('exp_month').notNullable();
        table.integer('exp_year').notNullable();
        table.string('cvv', 3).notNullable(); // cvv of the card
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('user_payment_methods');
};
