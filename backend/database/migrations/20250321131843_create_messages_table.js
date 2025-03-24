exports.up = function(knex) {
    return knex.schema.createTable('messages', function(table) {
        table.increments('id').primary();
        table.integer('sender_id').notNullable();
        table.integer('receiver_id').notNullable();
        table.text('content').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.boolean('is_read').defaultTo(false);
        table.integer('conversation_id').notNullable();
        
        // 添加外键约束
        table.foreign('sender_id').references('users.id');
        table.foreign('receiver_id').references('users.id');
        table.foreign('conversation_id').references('conversations.id');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('messages');
}; 