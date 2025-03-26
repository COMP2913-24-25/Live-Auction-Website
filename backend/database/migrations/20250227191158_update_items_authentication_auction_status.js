exports.up = async function (knex) {
    // Drop the dependent view
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    // 检查items表的schema - 使用正确的PRAGMA语法
    const itemsColumnsResult = await knex.raw('PRAGMA table_info(items)');
    const itemsColumns = Array.isArray(itemsColumnsResult) 
        ? itemsColumnsResult 
        : itemsColumnsResult.rows || [];
    const columnNames = itemsColumns.map(col => col.name);
    
    // 检查authentication_requests表的schema
    const authColumnsResult = await knex.raw('PRAGMA table_info(authentication_requests)');
    const authColumns = Array.isArray(authColumnsResult) 
        ? authColumnsResult 
        : authColumnsResult.rows || [];
    const authColumnNames = authColumns.map(col => col.name);

    console.log('Items表列:', columnNames);
    console.log('Authentication_requests表列:', authColumnNames);

    await knex.schema.alterTable('items', (table) => {
        // 只有在authenticated列存在时才删除它
        if (columnNames.includes('authenticated')) {
            table.dropColumn('authenticated');
        }
        
        // 只有在authentication_status列不存在时才添加它
        if (!columnNames.includes('authentication_status')) {
            table
                .enum('authentication_status', ['Not Requested', 'Pending', 'Approved', 'Rejected'])
                .defaultTo('Not Requested');
        }
        
        // 只有在auction_status列不存在时才添加它
        if (!columnNames.includes('auction_status')) {
            table
                .enum('auction_status', ['Not Listed', 'Active', 'Ended - Sold', 'Ended - Unsold'])
                .defaultTo('Not Listed');
        }
        
        // 总是尝试修改min_price和end_time列的默认值
        try {
            table.decimal('min_price').notNullable().defaultTo(1).alter();
            table.timestamp('end_time').notNullable().defaultTo("2025-02-20 12:00:00").alter();
        } catch (error) {
            console.warn('修改min_price或end_time时发生错误:', error.message);
        }
    });

    await knex.schema.alterTable('authentication_requests', (table) => {
        // 只在相应列不存在时添加
        if (!authColumnNames.includes('second_opinion_requested')) {
            table.boolean('second_opinion_requested').defaultTo(false);
        }
        
        if (!authColumnNames.includes('new_expert_id')) {
            table.integer('new_expert_id').references('id').inTable('users').onDelete('SET NULL');
        }
        
        if (!authColumnNames.includes('comments')) {
            table.text('comments').nullable().defaultTo('');
        }
        
        if (!authColumnNames.includes('decision_timestamp')) {
            table.timestamp('decision_timestamp').nullable();
        }
    });

    // 重新创建视图
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
    // 回滚函数保持不变，因为如果需要回滚，我们肯定想要完全回滚
    // Drop the dependent view
    await knex.schema.raw('DROP VIEW IF EXISTS item_current_bids');

    await knex.schema.alterTable('items', (table) => {
        table.boolean('authenticated').defaultTo(false);
        table.dropColumn('authentication_status');
        table.dropColumn('auction_status');
        table.decimal('min_price').notNullable().alter();
        table.timestamp('end_time').notNullable().alter();
    });

    await knex.schema.alterTable('authentication_requests', (table) => {
        table.dropColumn('second_opinion_requested');
        table.dropColumn('comments');
        table.dropColumn('decision_timestamp');
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
