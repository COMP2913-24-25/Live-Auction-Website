exports.up = async function(knex) {
    // Drop the dependent view
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    await knex.schema.alterTable('items', function(table) {
      table.dropColumn('duration'); // Remove duration column
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
  
exports.down = async function(knex) {
    // Drop the view before reverting the column addition
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    await knex.schema.alterTable('items', function(table) {
        table.integer('duration').notNullable().defaultTo(1).checkBetween([1, 5]);
        // Restore duration if needed
    });

    // Recreate the original view without the category_id dependency
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
  