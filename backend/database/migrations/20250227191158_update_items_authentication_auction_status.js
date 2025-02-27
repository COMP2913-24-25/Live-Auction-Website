exports.up = async function (knex) {
    // Drop the dependent view
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    await knex.schema.alterTable('items', (table) => {
        table.dropColumn('authenticated'); // Remove old boolean field
        table
            .enu('authentication_status', ['Not Requested', 'Pending', 'Approved', 'Rejected'])
            .defaultTo('Not Requested');
        table
            .enu('auction_status', ['Not Listed', 'Active', 'Ended - Sold', 'Ended - Unsold'])
            .defaultTo('Not Listed');
        table.decimal('min_price').notNullable().defaultTo(1).alter(); // Set a safe default
        table.timestamp('end_time').notNullable().defaultTo(knex.raw("DATETIME('now', '+1 day')")).alter(); // Set default to 1 day later
    });

    await knex.schema.alterTable('authentication_requests', (table) => {
        table.boolean('second_opinion_requested').defaultTo(false);
        table.text('comments').nullable();
        table.timestamp('decision_timestamp').nullable();
    });

    // Recreate the view with the updated schema
    await knex.schema.raw(`
        CREATE VIEW item_current_bids AS
        SELECT
            i.id AS item_id,
            i.title,
            i.description,
            i.min_price,
            i.end_time,
            i.authenticated,
            COALESCE(MAX(b.bid_amount), i.min_price) AS current_bid
        FROM
            items i
            LEFT JOIN bids b ON i.id = b.item_id
        GROUP BY
            i.id;
    `);
};

exports.down = async function (knex) {
    // Drop the dependent view
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    await knex.schema.alterTable('items', (table) => {
        table.boolean('authenticated').defaultTo(false);
        table.dropColumn('authentication_status');
        table.dropColumn('auction_status');
        table.decimal('min_price').notNullable().alter();
        table.timestamp('end_time').notNullable().alter();
    });

    await knex.schema.alterTable('authentication_requests', (table) => {
        table.dropColumn('second_opinion_requested');
        table.dropColumn('comments');
        table.dropColumn('decision_timestamp');
    });

    // Recreate the view with the updated schema
    await knex.schema.raw(`
        CREATE VIEW item_current_bids AS
        SELECT
            i.id AS item_id,
            i.title,
            i.description,
            i.min_price,
            i.end_time,
            i.authenticated,
            COALESCE(MAX(b.bid_amount), i.min_price) AS current_bid
        FROM
            items i
            LEFT JOIN bids b ON i.id = b.item_id
        GROUP BY
            i.id;
    `);
};
