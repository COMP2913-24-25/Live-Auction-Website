exports.up = function(knex) {
    return knex.schema.createTable('conversations', function(table) {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.integer('expert_id').notNullable();
        table.timestamp('last_message_time').defaultTo(knex.fn.now());
        table.enum('status', ['active', 'closed']).defaultTo('active');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        // 添加外键约束
        table.foreign('user_id').references('users.id');
        table.foreign('expert_id').references('users.id');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('conversations');
}; 