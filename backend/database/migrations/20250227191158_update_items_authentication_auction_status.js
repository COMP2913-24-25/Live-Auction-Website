exports.up = async function (knex) {
    // Drop the dependent view
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    // Modify the `items` table
    await knex.schema.alterTable('items', (table) => {
        table.dropColumn('authenticated'); // Remove old boolean field
        table
            .enum('authentication_status', ['Not Requested', 'Pending', 'Approved', 'Rejected'])
            .defaultTo('Not Requested'); // Add new enum column
        table
            .enum('auction_status', ['Not Listed', 'Active', 'Ended - Sold', 'Ended - Unsold'])
            .defaultTo('Not Listed'); // Add new enum column
        table.decimal('min_price').notNullable().defaultTo(1).alter(); // Set a safe default
        table.timestamp('end_time').notNullable().alter(); // Ensure column is not nullable
    });

    // Modify the `authentication_requests` table
    await knex.schema.alterTable('authentication_requests', (table) => {
        table.boolean('second_opinion_requested').defaultTo(false); // Add new column
        table.integer('new_expert_id').references('id').inTable('users').onDelete('SET NULL'); // Add foreign key
        table.text('comments').nullable().defaultTo(''); // Add comments column
        table.timestamp('decision_timestamp').nullable(); // Add decision timestamp
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
            i.authentication_status,
            i.auction_status,
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

    // Revert changes to the `items` table
    await knex.schema.alterTable('items', (table) => {
        table.boolean('authenticated').defaultTo(false); // Re-add old boolean field
        table.dropColumn('authentication_status'); // Remove new enum column
        table.dropColumn('auction_status'); // Remove new enum column
        table.decimal('min_price').notNullable().alter(); // Revert to original state
        table.timestamp('end_time').notNullable().alter(); // Revert to original state
    });

    // Revert changes to the `authentication_requests` table
    await knex.schema.alterTable('authentication_requests', (table) => {
        table.dropColumn('second_opinion_requested'); // Remove new column
        table.dropColumn('new_expert_id'); // Remove foreign key
        table.dropColumn('comments'); // Remove comments column
        table.dropColumn('decision_timestamp'); // Remove decision timestamp
    });

    // Recreate the view with the original schema
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
