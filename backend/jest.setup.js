const { beforeEach } = require('@jest/globals');
const sqlite3 = require('sqlite3').verbose();

// 在每次测试之前清理数据库
beforeEach(async () => {
  const db = new sqlite3.Database(':memory:'); // 使用内存数据库进行测试
  
  await new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS auctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        starting_price DECIMAL(10,2) NOT NULL,
        min_increment DECIMAL(10,2) NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}); 