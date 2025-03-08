const knex = require('knex');
const path = require('path');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

if (!connectionConfig) {
    throw new Error(`No configuration for environment: ${environment}`);
}

// 特别针对 SQLite，确保数据库文件路径正确
if (connectionConfig.client === 'sqlite3') {
    // 确保 SQLite 数据库文件路径是绝对路径
    if (connectionConfig.connection.filename && !path.isAbsolute(connectionConfig.connection.filename)) {
        connectionConfig.connection.filename = path.resolve(__dirname, '../../', connectionConfig.connection.filename);
    }
    console.log('SQLite database path:', connectionConfig.connection.filename);
}

console.log('Using database configuration:', {
    client: connectionConfig.client,
    environment: environment
});

// 配置连接
const db = knex(connectionConfig);

// 测试数据库连接
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection successful!');
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

module.exports = db; 