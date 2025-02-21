exports.up = function (knex) {
    return knex.schema.raw(`
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

exports.down = function (knex) {
    return knex.schema.raw(`DROP VIEW IF EXISTS item_current_bids;`);
};
