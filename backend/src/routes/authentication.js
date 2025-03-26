const express = require('express');
const router = express.Router();
const knex = require('../database/knex');
const multer = require('multer');  // 用于处理文件上传
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/authentication');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `auth-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 限制
});

// 处理认证请求路由
router.post('/request', upload.array('images', 6), async (req, res) => {
  try {
    // 处理表单数据
    const { title, description, category, itemId, expert_id } = req.body;
    const userId = req.user?.id || req.body.user_id;
    
    console.log('收到认证请求:', { 
      title, description, category, itemId, userId, expert_id 
    });
    
    // 打印所有收到的数据，用于调试
    console.log('完整请求体:', req.body);
    console.log('上传的文件:', req.files);

    // 确保必要的字段存在
    if (!title || !userId) {
      return res.status(400).json({
        success: false,
        error: '标题和用户ID是必要的'
      });
    }
    
    // 尝试插入记录
    let requestId;
    try {
      // 创建认证请求记录
      const result = await knex('authentication_requests').insert({
        user_id: userId,
        item_id: itemId || null,
        title,
        description,
        category_id: category || null,
        expert_id: expert_id || null,
        status: 'Pending',
        request_time: knex.fn.now()
      });
      requestId = result[0]; // 获取插入ID
    } catch (dbError) {
      console.error('数据库插入错误:', dbError);
      console.error('SQL错误:', dbError.message);
      return res.status(500).json({
        success: false,
        error: '数据库错误: ' + dbError.message
      });
    }
    
    // 处理图片上传
    if (req.files && req.files.length > 0) {
      try {
        const imageRecords = req.files.map(file => ({
          authentication_request_id: requestId,
          image_path: `/uploads/authentication/${file.filename}`
        }));
        
        await knex('authentication_request_images').insert(imageRecords);
      } catch (imgError) {
        console.error('图片保存错误:', imgError);
        // 不阻止主流程，只记录错误
      }
    }
    
    return res.json({
      success: true,
      message: '认证请求提交成功',
      request_id: requestId
    });
  } catch (error) {
    console.error('创建认证请求失败，详细错误:', error);
    console.error('错误堆栈:', error.stack);
    console.error('请求体:', req.body);
    return res.status(500).json({
      success: false,
      error: '创建认证请求时发生错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 