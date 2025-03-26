const express = require('express');
const knex = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log("接收到分类列表请求");
    const categories = await knex('categories').select('*');
    console.log("返回分类列表:", categories);
    res.json({ categories });
  } catch (error) {
    console.error("获取分类列表失败:", error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
