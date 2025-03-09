const knex = require('../database/knex');

async function setupTestDatabase() {
  // 确保在测试环境中
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setupTestDatabase should only be called in test environment');
  }
  
  try {
    // 1. 删除所有现有表
    const tables = await knex.raw('SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "knex_%"');
    for (const row of tables) {
      await knex.schema.dropTableIfExists(row.name);
    }
    
    // 2. 运行迁移
    await knex.migrate.latest();
    
    // 3. 确认必要的表已创建
    const requiredTables = ['users', 'items', 'bids', 'notifications'];
    for (const table of requiredTables) {
      const exists = await knex.schema.hasTable(table);
      if (!exists) {
        throw new Error(`Required table ${table} was not created by migrations`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

module.exports = {
  setupTestDatabase
}; 