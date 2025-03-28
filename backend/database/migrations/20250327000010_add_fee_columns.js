exports.up = async function (knex) {
  // First drop the view if it exists
  await knex.schema.dropViewIfExists("item_current_bids");

  // Check for existing columns separately
  const hasPostingFee = await knex.schema.hasColumn("items", "posting_fee");
  const hasFinalPrice = await knex.schema.hasColumn("items", "final_price");

  // Perform table alterations
  const operations = [];

  if (!hasFinalPrice) {
    operations.push(
      knex.schema.alterTable("items", (table) => {
        table.decimal("final_price", 10, 2);
      })
    );
  }

  operations.push(
    knex.schema.createTable("transactions", (table) => {
      table.increments("id");
      table.integer("user_id").references("users.id");
      table.integer("auction_id").references("items.id");
      table.decimal("amount", 10, 2);
      table.string("type");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
  );

  await Promise.all(operations);

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
  // Drop view first
  await knex.schema.dropViewIfExists('item_current_bids');

  // Drop tables and columns
  await knex.schema
    .dropTableIfExists('transactions')
    .alterTable('items', table => {
      if (knex.schema.hasColumn('items', 'final_price')) {
        table.dropColumn('final_price');
      }
    });

  // Recreate the view
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