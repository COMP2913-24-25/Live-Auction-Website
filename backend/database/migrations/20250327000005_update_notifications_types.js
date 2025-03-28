exports.up = async function(knex) {
  // Check if notifications table exists
  const hasTable = await knex.schema.hasTable('notifications');

  if (!hasTable) {
    // Create notifications table if it doesn't exist
    await knex.schema.createTable('notifications', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('type').notNullable();
      table.text('message').notNullable();
      table.integer('auction_id').references('id').inTable('items').onDelete('CASCADE');
      table.boolean('read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // For SQLite, which doesn't support ALTER TABLE ADD CONSTRAINT
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS notifications_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT CHECK(type IN ('BID_PLACED', 'AUCTION_END', 'ITEM_SOLD', 'OUTBID', 'AUCTION_WON', 'AUTHENTICATION_RESULT')) NOT NULL,
      message TEXT NOT NULL,
      auction_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO notifications_new SELECT * FROM notifications;
    DROP TABLE notifications;
    ALTER TABLE notifications_new RENAME TO notifications;
  `);

  return Promise.resolve();
};

exports.down = async function(knex) {
  // For SQLite, recreate table without the type constraint
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS notifications_old (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      auction_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO notifications_old SELECT * FROM notifications;
    DROP TABLE notifications;
    ALTER TABLE notifications_old RENAME TO notifications;
  `);

  return Promise.resolve();
};