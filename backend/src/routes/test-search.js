const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: '测试搜索API正常工作' });
});

module.exports = router; 