const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

// 初始化通知表
const initializeNotificationsTable = async () => {
  try {
    // 检查notifications表是否存在
    const exists = await knex.schema.hasTable('notifications');
    if (!exists) {
      await knex.schema.createTable('notifications', table => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.string('type').notNullable();
        table.string('message').notNullable();
        table.integer('item_id').nullable();
        table.string('item_title').nullable();
        table.boolean('read').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        // 添加索引
        table.index(['user_id', 'read']);
      });
      console.log('Created notifications table');
    }
  } catch (error) {
    console.error('Failed to initialize notifications table:', error);
  }
};

// 初始化表
initializeNotificationsTable();

// 获取用户的通知
router.get('/user', async (req, res) => {
  try {
    console.log('Get user notifications request received');
    console.log('User in request:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No authenticated user found');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // 确认notifications表存在
    const tableExists = await knex.schema.hasTable('notifications');
    if (!tableExists) {
      console.log('Notifications table does not exist, creating it now');
      await initializeNotificationsTable();
    }

    const notifications = await knex('notifications')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(20);

    console.log(`Found ${notifications.length} notifications for user ${req.user.id}`);
    
    return res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// 标记通知为已读
router.put('/:id/read', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    
    // 确保通知属于该用户
    const notification = await knex('notifications')
      .where({
        id,
        user_id: req.user.id
      })
      .first();
      
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or not owned by user'
      });
    }
    
    // 更新为已读
    await knex('notifications')
      .where('id', id)
      .update({ read: true });
      
    return res.json({
      success: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// 创建竞标成功通知的工具函数
const createBidWinNotification = async (userId, itemId, itemTitle) => {
  try {
    await knex('notifications').insert({
      user_id: userId,
      type: 'bid_win',
      message: `You've successfully won the auction for ${itemTitle}`,
      item_id: itemId,
      item_title: itemTitle,
      read: false,
      created_at: knex.fn.now()
    });
    return true;
  } catch (error) {
    console.error('Error creating bid win notification:', error);
    return false;
  }
};

// 添加调试路由
router.get('/debug', async (req, res) => {
  try {
    // 检查表是否存在
    const tableExists = await knex.schema.hasTable('notifications');
    console.log('Notifications table exists:', tableExists);
    
    // 检查数据库连接
    let dbConnectionOk = false;
    try {
      const result = await knex.raw('SELECT 1+1 as result');
      dbConnectionOk = result && result.length > 0;
      console.log('Database connection test:', result);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
    }
    
    // 手动检查通知表结构
    let tableColumns = [];
    if (tableExists) {
      try {
        tableColumns = Object.keys(await knex('notifications').columnInfo());
        console.log('Notification table columns:', tableColumns);
      } catch (tableError) {
        console.error('Error getting table columns:', tableError);
      }
    }
    
    // 获取所有通知数量
    let count = 0;
    let notifications = [];
    
    if (tableExists) {
      count = await knex('notifications').count('* as total').first();
      console.log('Notifications count:', count);
      
      // 获取最近10条通知
      notifications = await knex('notifications')
        .orderBy('created_at', 'desc')
        .limit(10);
      console.log('Recent notifications:', notifications);
    }
    
    // 获取用户信息
    const userInfo = req.user ? {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    } : 'Not authenticated';
    
    res.json({
      success: true,
      tableExists,
      tableColumns,
      dbConnectionOk,
      notificationsCount: count ? count.total : 0,
      recentNotifications: notifications,
      currentUser: userInfo
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加创建测试通知的临时路由
router.post('/create-test', async (req, res) => {
  try {
    console.log('Create test notification request received');
    console.log('User in request:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('Authentication required for test notification');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const message = req.body.message || 'Test notification';
    console.log(`Creating test notification for user ${req.user.id} with message: ${message}`);
    
    // 确认表已存在
    const tableExists = await knex.schema.hasTable('notifications');
    if (!tableExists) {
      console.log('Notifications table does not exist, creating it');
      await initializeNotificationsTable();
    }
    
    await knex('notifications').insert({
      user_id: req.user.id,
      type: 'test',
      message,
      item_id: null,
      item_title: null,
      read: false,
      created_at: knex.fn.now()
    });
    
    console.log('Test notification created successfully');
    res.json({
      success: true,
      message: 'Test notification created'
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    
    // 检查是否是数据库错误
    let errorMessage = error.message;
    if (error.code) {
      errorMessage = `Database error (${error.code}): ${error.message}`;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 添加重置通知表的路由（仅用于调试）
router.get('/reset-table', async (req, res) => {
  try {
    console.log('Resetting notifications table');
    
    // 删除表（如果存在）
    const exists = await knex.schema.hasTable('notifications');
    if (exists) {
      await knex.schema.dropTable('notifications');
      console.log('Dropped existing notifications table');
    }
    
    // 重新创建表
    await initializeNotificationsTable();
    
    // 创建一个测试通知（如果用户已登录）
    if (req.user && req.user.id) {
      await knex('notifications').insert({
        user_id: req.user.id,
        type: 'system',
        message: 'Notifications system initialized',
        read: false,
        created_at: knex.fn.now()
      });
      console.log('Created test notification after reset');
    }
    
    res.json({
      success: true,
      message: 'Notifications table reset successfully'
    });
  } catch (error) {
    console.error('Error resetting notifications table:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 导出路由器和工具函数
module.exports = {
  router,
  createBidWinNotification
}; 