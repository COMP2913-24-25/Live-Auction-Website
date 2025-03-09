exports.up = function (knex) {
    return knex.schema
        .createTable('users', function (table) {
            table.increments('id').primary();
            table.string('username').unique().notNullable();
            table.string('email').unique().notNullable();
            table.string('password_hash').notNullable();
            table.integer('role').notNullable().defaultTo(1);
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('items', function (table) {
            table.increments('id').primary();
            table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.string('title').notNullable();
            table.text('description');
            table.float('min_price').notNullable();
            table.integer('duration').notNullable().checkBetween([1, 5]);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('end_time').notNullable();
            table.boolean('authenticated').defaultTo(false);
        })
        .createTable('bids', function (table) {
            table.increments('id').primary();
            table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
            table.float('bid_amount').notNullable();
            table.timestamp('bid_time').defaultTo(knex.fn.now());
        })
        .createTable('authentication_requests', function (table) {
            table.increments('id').primary();
            table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
            table.enum('status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
            table.integer('expert_id').references('id').inTable('users').onDelete('SET NULL');
            table.timestamp('request_time').defaultTo(knex.fn.now());
        })
        .createTable('payments', function (table) {
            table.increments('id').primary();
            table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
            table.float('amount').notNullable();
            table.enum('status', ['Pending', 'Completed', 'Failed']).defaultTo('Pending');
            table.timestamp('payment_time').defaultTo(knex.fn.now());
        })
        .createTable('watchlist', function (table) {
            table.increments('id').primary();
            table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
            table.timestamp('added_at').defaultTo(knex.fn.now());
        })
        .hasTable('notifications').then(exists => {
            if (!exists) {
                return knex.schema.createTable('notifications', table => {
                    table.increments('id').primary();
                    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
                    table.text('message').notNullable();
                    table.boolean('read').defaultTo(false);
                    table.timestamp('created_at').defaultTo(knex.fn.now());
                    table.foreign('user_id').references('users.id').onDelete('CASCADE');
                });
            }
        })
        .createTable('item_images', function (table) {
            table.increments('id').primary();
            table.integer('item_id').notNullable().references('id').inTable('items').onDelete('CASCADE');
            table.string('image_url').notNullable();
        })
        .then(() => {
            return knex.schema.raw('CREATE INDEX idx_item_images_item_id ON item_images(item_id)');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('item_images')
        .dropTableIfExists('notifications')
        .dropTableIfExists('watchlist')
        .dropTableIfExists('payments')
        .dropTableIfExists('authentication_requests')
        .dropTableIfExists('bids')
        .dropTableIfExists('items')
        .dropTableIfExists('users');
};

