const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 创建数据库连接
const db = new sqlite3.Database(
  process.env.NODE_ENV === 'test' ? ':memory:' : './database/db.sqlite',
  (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Database connected successfully');
      
      // 先删除所有已存在的表
      const dropTables = `
        DROP TABLE IF EXISTS notifications;
        DROP TABLE IF EXISTS watchlist;
        DROP TABLE IF EXISTS payments;
        DROP TABLE IF EXISTS authentication_requests;
        DROP TABLE IF EXISTS bids;
        DROP TABLE IF EXISTS items;
        DROP TABLE IF EXISTS users;
      `;
      
      // 先执行删除表，再执行创建表
      db.exec(dropTables, (err) => {
        if (err) {
          console.error('Error dropping tables:', err);
        } else {
          console.log('Old tables dropped successfully');
          
          // 读取并执行建表语句
          const initSQL = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');
          console.log('Read SQL file, length:', initSQL.length);
          
          // 直接执行整个 SQL 文件
          db.exec(initSQL, (err) => {
            if (err) {
              console.error('Error executing SQL:', err);
            } else {
              console.log('SQL executed successfully');
              // 验证创建的表
              db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
                if (err) {
                  console.error('Error checking tables:', err);
                } else {
                  console.log('Created tables:', rows.map(r => r.name));
                }
              });
            }
          });
        }
      });
    }
  }
);

// CORS配置
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

// 添加测试路由
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// API端点
app.post('/api/auctions', upload.single('image'), (req, res) => {
  const {
    title,
    description,
    starting_price,  // 这个会存到 min_price 字段
    start_time,
    end_time
  } = req.body;

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // 数据验证
  if (!title) {
    return res.status(400).json({ error: 'The item name cannot be empty' });
  }

  if (!starting_price || starting_price <= 0) {
    return res.status(400).json({ error: 'The starting price must be greater than 0' });
  }

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  if (duration < 1 || duration > 5) {
    return res.status(400).json({ error: 'The duration of the auction must be between 1-5 days' });
  }

  console.log('Received data:', req.body);

  // 使用新的 items 表结构
  const sql = `
    INSERT INTO items (
      user_id, title, description, min_price,
      duration, end_time, authenticated
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // 临时使用 user_id = 1，实际应该从认证中获取
  db.run(sql, 
    [1, title, description, starting_price, duration, end_time, false],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(400).json({ error: err.message });
      }
      res.json({
        message: "Auction item created successfully",
        id: this.lastID
      });
    }
  );
});

// 获取所有拍卖商品
app.get('/api/auctions', (req, res) => {
  console.log('A request for an auction list was received');
  
  // 修改查询以格式化返回数据
  const sql = `
    SELECT 
      id,
      user_id,
      title,
      description,
      min_price,
      duration,
      created_at,
      end_time,
      authenticated
    FROM items
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(400).json({ error: err.message });
    }
    console.log('Query result:', rows);
    res.json(rows || []);
  });
});

// 添加新的路由处理认证请求
app.post('/api/authentication-requests', upload.single('supporting_documents'), async (req, res) => {
  try {
    const { item_id, description } = req.body;
    const file = req.file;

    // 验证物品是否存在
    const item = await db.get('SELECT * FROM items WHERE id = ?', item_id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // 创建认证请求
    const result = await db.run(
      `INSERT INTO authentication_requests (user_id, item_id, status, request_time)
       VALUES (?, ?, 'Pending', CURRENT_TIMESTAMP)`,
      [item.user_id, item_id]
    );

    res.json({
      message: 'Authentication request submitted successfully',
      request_id: result.lastID
    });
  } catch (error) {
    console.error('Error creating authentication request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 静态文件服务
app.use('/uploads', express.static('uploads'));

module.exports = app;