const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');

const app = express();

// Connect to your SQLite database
const db = new sqlite3.Database('./database/db.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Import routes
const uploadRoutes = require('./routes/upload');
const auctionRoutes = require('./routes/auction');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');

app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));

// 创建数据库连接
//Create a new database in memory for testing
const db = new sqlite3.Database('./database/db.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// Import routes
const uploadRoutes = require('./routes/upload');
// const auctionRoutes = require('./routes/auctions');
// const authRoutes = require('./routes/auth');
// const categoriesRoutes = require('./routes/categories');
// const searchRoutes = require('./routes/search');

// CORS配置
//CORS configuration
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

//Static file service
app.use('/uploads', express.static('uploads'));

// Mount routes
app.use('/api', uploadRoutes);
// app.use('/api/auctions', auctionRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/categories', categoriesRoutes);
// app.use('/api/search', searchRoutes);

// 添加测试路由
//Add a test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// 文件上传配置
//File upload configuration
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
// API endpoints
app.post('/api/auctions', upload.single('image'), (req, res) => {
  const {
    title,
    description,
    starting_price,  // 这个会存到 min_price 字段 // this will be stored in the min_price field
    start_time,
    end_time
  } = req.body;

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // 数据验证
  //Data validation
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
  //Use the new items table structure
  const sql = `
    INSERT INTO items (
      user_id, title, description, min_price,
      duration, end_time, authenticated
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // 临时使用 user_id = 1，实际应该从认证中获取
  //Temporarily use user_id = 1, should be retrieved from authentication
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
//Get all auction items
app.get('/api/auctions', (req, res) => {
  console.log('A request for an auction list was received');
  
  // 修改查询以格式化返回数据
  //Modify the query to format the returned data
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

// 静态文件服务

// Fetch all active auctions
app.get('/api/auctions', (req, res) => {
  const sql = `
    SELECT
      icb.item_id AS id,
      icb.title,
      icb.description,
      icb.min_price,
      icb.end_time,
      icb.authenticated,
      icb.current_bid,
      GROUP_CONCAT(ii.image_url) AS image_urls,
      u.username AS seller_name
    FROM
      item_current_bids icb
    LEFT JOIN
      items i ON icb.item_id = i.id
    LEFT JOIN
      users u ON i.user_id = u.id
    LEFT JOIN
      item_images ii ON icb.item_id = ii.item_id
    WHERE
      icb.end_time > datetime('now')
    GROUP BY
      icb.item_id
    ORDER BY
      i.created_at DESC`

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
})

module.exports = app;