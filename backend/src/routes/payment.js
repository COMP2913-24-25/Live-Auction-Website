require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const router = express.Router();
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not set, using mock implementation');
  // 模拟 Stripe 对象
  stripe = {
    paymentIntents: {
      create: async (options) => ({
        id: `pi_${Math.random().toString(36).substring(2, 15)}`,
        client_secret: `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`,
        amount: options.amount,
        currency: options.currency,
        metadata: options.metadata
      })
    },
    webhooks: {
      constructEvent: (body, signature, secret) => {
        return JSON.parse(body);
      }
    }
  };
}
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 创建支付意图
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, itemId, userId, paymentMethodId } = req.body;
    
    // 验证金额和商品
    if (!amount || !itemId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 验证支付方式是否存在
    if (paymentMethodId) {
      const paymentMethod = await db('user_payment_methods')
        .where({ id: paymentMethodId, user_id: userId })
        .first();
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }
    }
    
    // 创建 Stripe 支付意图
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe 使用分为单位
      currency: 'gbp',
      metadata: {
        itemId,
        userId,
        paymentMethodId: paymentMethodId || ''
      }
    });
    
    // 将支付意图保存到数据库
    await db('payment_intents').insert({
      stripe_payment_intent_id: paymentIntent.id,
      user_id: userId,
      item_id: itemId,
      amount,
      status: 'created',
      created_at: new Date()
    });
    
    // 返回客户端密钥
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// 保存支付方式
const savePaymentMethod = async (req, res) => {
  try {
    const { userId, cardNumber, expiry, cvv } = req.body;
    
    // 验证数据
    if (!userId || !cardNumber || !expiry || !cvv) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 获取卡号后四位
    const last4 = cardNumber.slice(-4);
    
    // 解析过期日期 (MM/YY 格式)
    const [expMonth, expYear] = expiry.split('/');
    
    // 确定卡类型
    let cardType = "Unknown";
    if (cardNumber.startsWith('4')) {
      cardType = "Visa";
    } else if (cardNumber.startsWith('5')) {
      cardType = "MasterCard";
    } else if (cardNumber.startsWith('3')) {
      cardType = "American Express";
    } else if (cardNumber.startsWith('6')) {
      cardType = "Discover";
    }
    
    // 在实际应用中，这里应该调用 Stripe API 创建支付方式并获取 token
    // 这里我们模拟一个 token
    const tokenizedCardId = `tok_${Math.random().toString(36).substring(2, 15)}`;
    
    // 检查用户是否已经有这张卡
    const existingCard = await db('user_payment_methods')
      .where({ 
        user_id: userId,
        last4: last4,
        card_type: cardType,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10) + 2000
      })
      .first();
    
    if (existingCard) {
      return res.json({ 
        success: true, 
        message: 'Payment method already exists',
        paymentMethodId: existingCard.id
      });
    }
    
    // 插入数据
    let id;
    try {
      // 对于 SQLite，我们需要特殊处理 returning
      const result = await db('user_payment_methods').insert({
        user_id: req.user.id,
        payment_provider: 'Stripe',
        tokenized_card_id: tokenizedCardId,
        last4,
        card_type: cardType,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10) + 2000, // 假设 YY 格式，转换为完整年份
        cvv: cvv,
        created_at: db.fn.now() // 使用数据库的NOW()函数
      });
      
      // 在 SQLite 中，insert 返回的是最后插入的 ID
      id = result[0];
      
      console.log('Database insertion successful, ID:', id);
      
      res.status(201).json({ 
        message: 'Payment method added successfully',
        id: id
      });
    } catch (error) {
      console.error('Error saving payment method:', error);
      // 打印更详细的错误信息
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.errno) {
        console.error('Error number:', error.errno);
      }
      if (error.sql) {
        console.error('SQL:', error.sql);
      }
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } catch (error) {
    console.error('Error saving payment method:', error);
    res.status(500).json({ error: 'Failed to save payment method' });
  }
};

// 处理 Stripe Webhook
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // 处理支付成功事件
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    try {
      // 更新数据库中的支付状态
      await db('payment_intents')
        .where({ stripe_payment_intent_id: paymentIntent.id })
        .update({ 
          status: 'succeeded',
          updated_at: new Date()
        });
      
      // 获取商品和用户信息
      const { itemId, userId } = paymentIntent.metadata;
      
      // 创建支付记录
      await db('payments').insert({
        user_id: userId,
        item_id: itemId,
        amount: paymentIntent.amount / 100,
        status: 'Completed',
        stripe_payment_id: paymentIntent.id,
        payment_time: new Date()
      });
      
      // 更新商品状态
      await db('items')
        .where({ id: itemId })
        .update({ 
          auction_status: 'Ended - Sold',
          updated_at: new Date()
        });
      
    } catch (error) {
      console.error('Error processing payment success:', error);
    }
  }
  
  // 处理支付失败事件
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    
    try {
      await db('payment_intents')
        .where({ stripe_payment_intent_id: paymentIntent.id })
        .update({ 
          status: 'failed',
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error processing payment failure:', error);
    }
  }
  
  res.json({ received: true });
};

// 获取用户的支付方式
const getUserPaymentMethods = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const paymentMethods = await db('user_payment_methods')
      .where({ user_id: userId })
      .select('id', 'last4', 'card_type', 'exp_month', 'exp_year', 'created_at');
    
    // 格式化数据以便前端使用
    const formattedPaymentMethods = paymentMethods.map(method => ({
      id: method.id,
      cardNumberLast4: method.last4,
      cardType: method.card_type,
      expiryDate: `${method.exp_month.toString().padStart(2, '0')}/${method.exp_year.toString().slice(-2)}`,
      createdAt: method.created_at
    }));
    
    res.json(formattedPaymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};

// 处理支付
const processPayment = async (req, res) => {
  try {
    const { userId, itemId, paymentMethodId, amount } = req.body;
    
    // 验证数据
    if (!userId || !itemId || !paymentMethodId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 获取支付方式
    const paymentMethod = await db('user_payment_methods')
      .where({ id: paymentMethodId, user_id: userId })
      .first();
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // 获取物品信息
    const item = await db('items')
      .where({ id: itemId })
      .first();
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // 检查物品状态
    if (item.auction_status !== 'Active') {
      return res.status(400).json({ error: 'This auction is not active' });
    }
    
    // 在实际应用中，这里应该调用 Stripe API 处理支付
    // 这里我们模拟一个成功的支付
    const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
    const paymentStatus = 'Completed';
    
    // 创建支付记录
    await db('payments').insert({
      user_id: userId,
      item_id: itemId,
      amount: amount,
      status: paymentStatus,
      stripe_payment_id: paymentId,
      payment_method_id: paymentMethodId,
      payment_time: new Date(),
      created_at: new Date()
    });
    
    // 更新物品状态
    await db('items')
      .where({ id: itemId })
      .update({ 
        auction_status: 'Ended - Sold',
        updated_at: new Date()
      });
    
    // 创建通知
    await db('notifications').insert({
      user_id: item.user_id, // 通知卖家
      message: `Your item "${item.title}" has been sold for $${amount}`,
      read: false,
      created_at: new Date()
    });
    
    await db('notifications').insert({
      user_id: userId, // 通知买家
      message: `You have successfully purchased "${item.title}" for $${amount}`,
      read: false,
      created_at: new Date()
    });
    
    res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      paymentId: paymentId,
      status: paymentStatus
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

// 获取用户的支付历史
const getUserPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const payments = await db('payments')
      .where({ user_id: userId })
      .join('items', 'payments.item_id', 'items.id')
      .join('user_payment_methods', 'payments.payment_method_id', 'user_payment_methods.id')
      .select(
        'payments.id',
        'payments.amount',
        'payments.status',
        'payments.payment_time',
        'items.title as item_title',
        'items.id as item_id',
        'user_payment_methods.last4',
        'user_payment_methods.card_type'
      )
      .orderBy('payments.payment_time', 'desc');
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// 获取支付详情
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await db('payments')
      .where('payments.id', paymentId)
      .join('items', 'payments.item_id', 'items.id')
      .join('user_payment_methods', 'payments.payment_method_id', 'user_payment_methods.id')
      .join('users as buyer', 'payments.user_id', 'buyer.id')
      .join('users as seller', 'items.user_id', 'seller.id')
      .select(
        'payments.id',
        'payments.amount',
        'payments.status',
        'payments.payment_time',
        'payments.stripe_payment_id',
        'items.title as item_title',
        'items.description as item_description',
        'items.id as item_id',
        'user_payment_methods.last4',
        'user_payment_methods.card_type',
        'buyer.username as buyer_name',
        'seller.username as seller_name'
      )
      .first();
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};

// 获取物品的支付状态
const getItemPaymentStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const payment = await db('payments')
      .where('item_id', itemId)
      .orderBy('payment_time', 'desc')
      .first();
    
    if (!payment) {
      return res.json({ status: 'No Payment' });
    }
    
    res.json({ status: payment.status });
  } catch (error) {
    console.error('Error fetching item payment status:', error);
    res.status(500).json({ error: 'Failed to fetch item payment status' });
  }
};

// 路由定义
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);
router.post('/save-payment-method', authenticateToken, savePaymentMethod);
router.post('/process-payment', authenticateToken, processPayment);
router.get('/payment-methods/:userId', authenticateToken, getUserPaymentMethods);
router.get('/payment-history/:userId', authenticateToken, getUserPaymentHistory);
router.get('/payment/:paymentId', authenticateToken, getPaymentDetails);
router.get('/item-payment-status/:itemId', getItemPaymentStatus);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// 获取用户的支付方式
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Getting payment methods for user ${userId}`);
    
    // 查询用户的支付方式
    const payments = await db('user_payment_methods')
      .where({ user_id: userId })
      .select('id', 'user_id', 'tokenized_card_id', 'last4', 'card_type', 'exp_month', 'exp_year', 'cvv', 'created_at');
    
    // 格式化响应，使其与前端代码兼容
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      user_id: payment.user_id,
      payment_method_id: payment.tokenized_card_id, // 为了保持向后兼容
      tokenized_card_id: payment.tokenized_card_id,
      last4: payment.last4,
      brand: payment.card_type, // 前端代码可能在使用brand，所以这里提供
      card_type: payment.card_type,
      exp_month: payment.exp_month,
      exp_year: payment.exp_year,
      cvv: payment.cvv,
      created_at: payment.created_at
    }));
    
    console.log(`Got payment methods for user ${userId}:`, formattedPayments);
    
    return res.json(formattedPayments);
  } catch (error) {
    console.error('Error obtaining payment method:', error);
    return res.status(500).json({ error: 'Error obtaining payment method' });
  }
});

// 添加新的支付方式
router.post('/methods', authenticateToken, async (req, res) => {
  try {
    const { tokenized_card_id, user_id, card_type, last4, exp_month, exp_year, cvv } = req.body;
    
    console.log('Received payment method request:', req.body);
    
    // 验证用户ID是否与当前登录用户匹配
    if (parseInt(user_id) !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to add payment methods for other users' });
    }
    
    // 检查是否已存在相同的支付方式
    const existingMethod = await db('user_payment_methods')
      .where({ tokenized_card_id, user_id })
      .first();
    
    if (existingMethod) {
      return res.json({ message: 'Payment method already exists', id: existingMethod.id });
    }
    
    // 准备插入数据 - 修复日期格式
    const paymentData = {
      user_id,
      payment_provider: 'Stripe',
      tokenized_card_id,
      last4,
      card_type,
      exp_month,
      exp_year,
      cvv,
      created_at: db.fn.now() // 使用数据库的NOW()函数
    };
    
    console.log('Preparing to insert data:', paymentData);
    
    // 插入新支付方式
    const [id] = await db('user_payment_methods').insert(paymentData);
    
    console.log(`User ${user_id} added a new payment method:`, { id, tokenized_card_id, card_type, last4 });
    
    return res.status(201).json({ 
      message: 'Payment method added successfully', 
      id, 
      tokenized_card_id,
      card_type,
      last4,
      exp_month,
      exp_year,
      cvv
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    
    // 详细记录错误信息
    if (error.code) console.error('Error code:', error.code);
    if (error.errno) console.error('Error number:', error.errno);
    if (error.sql) console.error('SQL:', error.sql);
    
    return res.status(500).json({ error: 'Failed to add payment method', details: error.message });
  }
});

// 删除支付方式
router.delete('/methods/:id', authenticateToken, async (req, res) => {
  try {
    const methodId = req.params.id;
    const userId = req.user.id;
    
    // 查询支付方式是否属于当前用户
    const method = await db('user_payment_methods')
      .where({ id: methodId, user_id: userId })
      .first();
    
    if (!method) {
      return res.status(404).json({ error: 'Payment method does not exist or does not belong to the current user' });
    }
    
    // 删除支付方式
    await db('user_payment_methods')
      .where({ id: methodId })
      .delete();
    
    return res.json({ message: 'Payment method deleted' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

module.exports = router; 