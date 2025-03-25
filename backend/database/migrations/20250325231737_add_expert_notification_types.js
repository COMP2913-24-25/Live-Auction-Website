exports.up = function(knex) {
    return knex.schema.createTable('notifications_new', function(table) {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('auction_id').references('id').inTable('items').onDelete('CASCADE');
        table.enum('type', [
            // User notifications
            'outbid',
            'won',
            'ending_soon',
            'ended',
            // Expert notifications
            'review_request',
            'review_reminder',
            'review_completed'
        ]).notNullable();
        table.text('message').nullable();
        table.boolean('read').defaultTo(false);
        table.boolean('deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .then(function() {
        return knex.raw(`
            INSERT INTO notifications_new 
            SELECT * FROM notifications;
        `);
    })
    .then(function() {
        return knex.schema.dropTable('notifications');
    })
    .then(function() {
        return knex.schema.renameTable('notifications_new', 'notifications');
    });
};

exports.down = function(knex) {
    return knex.schema.createTable('notifications_old', function(table) {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('auction_id').references('id').inTable('items').onDelete('CASCADE');
        table.enum('type', [
            'outbid',
            'won',
            'ending_soon',
            'ended'
        ]).notNullable();
        table.text('message').nullable();
        table.boolean('read').defaultTo(false);
        table.boolean('deleted').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .then(function() {
        return knex.raw(`
            INSERT INTO notifications_old 
            SELECT * FROM notifications 
            WHERE type IN ('outbid', 'won', 'ending_soon', 'ended');
        `);
    })
    .then(function() {
        return knex.schema.dropTable('notifications');
    })
    .then(function() {
        return knex.schema.renameTable('notifications_old', 'notifications');
    });
};