exports.up = async function(knex) {
  // First drop the view if it exists
  await knex.schema.dropViewIfExists('item_current_bids');

  // Then perform table alterations
  await knex.schema.hasColumn('items', ['posting_fee', 'final_price'])
    .then(async ([hasPostingFee, hasFinalPrice]) => {
      const operations = [];

      if (!hasFinalPrice) {
        operations.push(
          knex.schema.alterTable('items', table => {
            table.decimal('final_price', 10, 2);
          })
        );
      }

      operations.push(
        knex.schema.createTableIfNotExists('transactions', table => {
          table.increments('id');
          table.integer('user_id').references('users.id');
          table.integer('auction_id').references('items.id');
          table.decimal('amount', 10, 2);
          table.string('type');
          table.timestamp('created_at').defaultTo(knex.fn.now());
        })
      );

      await Promise.all(operations);
    });

  // Recreate the view
  return knex.schema.createView('item_current_bids', function(view) {
    view.as(
      knex('bids')
        .select('item_id')
        .max('bid_amount as current_bid')
        .groupBy('item_id')
    );
  });
};

exports.down = async function(knex) {
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
  return knex.schema.createView('item_current_bids', function(view) {
    view.as(
      knex('bids')
        .select('item_id')
        .max('bid_amount as current_bid')
        .groupBy('item_id')
    );
  });
};