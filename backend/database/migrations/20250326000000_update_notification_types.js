exports.up = function(knex) {
    return knex.schema.raw(`
        DROP TABLE IF EXISTS notifications_new;
        CREATE TABLE notifications_new (
            id integer not null primary key autoincrement,
            user_id integer not null,
            auction_id integer,
            type text check (type in (
                'outbid',
                'won', 
                'ending_soon',
                'ended',
                'posting_fee',
                'bid_placed',
                'review_request',
                'review_reminder',
                'review_completed'
            )) not null,
            message text null,
            read boolean default '0',
            deleted boolean default '0',
            created_at datetime default CURRENT_TIMESTAMP,
            foreign key(user_id) references users(id) on delete CASCADE,
            foreign key(auction_id) references items(id) on delete CASCADE
        );
        INSERT INTO notifications_new SELECT * FROM notifications;
        DROP TABLE notifications;
        ALTER TABLE notifications_new RENAME TO notifications;
    `);
};

exports.down = function(knex) {
    return knex.schema.raw(`
        DROP TABLE IF EXISTS notifications_new;
        CREATE TABLE notifications_new (
            id integer not null primary key autoincrement,
            user_id integer not null,
            auction_id integer,
            type text check (type in (
                'outbid',
                'won',
                'ending_soon',
                'ended',
                'review_request',
                'review_reminder',
                'review_completed'
            )) not null,
            message text null,
            read boolean default '0',
            deleted boolean default '0',
            created_at datetime default CURRENT_TIMESTAMP,
            foreign key(user_id) references users(id) on delete CASCADE,
            foreign key(auction_id) references items(id) on delete CASCADE
        );
        INSERT INTO notifications_new SELECT * FROM notifications;
        DROP TABLE notifications;
        ALTER TABLE notifications_new RENAME TO notifications;
    `);
};