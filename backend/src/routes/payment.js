require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const router = express.Router();
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not set, using mock implementation');
  // Mock Stripe implementation
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
const { authenticateUser: authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, itemId, userId, paymentMethodId } = req.body;
    
    // test for missing fields
    if (!amount || !itemId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // check if payment method exists
    if (paymentMethodId) {
      const paymentMethod = await db('user_payment_methods')
        .where({ id: paymentMethodId, user_id: userId })
        .first();
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }
    }
    
    // create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 
      currency: 'gbp',
      metadata: {
        itemId,
        userId,
        paymentMethodId: paymentMethodId || ''
      }
    });
    
    // change status to created
    await db('payment_intents').insert({
      stripe_payment_intent_id: paymentIntent.id,
      user_id: userId,
      item_id: itemId,
      amount,
      status: 'created',
      created_at: new Date()
    });
    
    // send client secret to client
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// save Payment Method
const savePaymentMethod = async (req, res) => {
  try {
    console.log('接收到保存支付方式请求, 请求体:', req.body);
    
    // 尝试从多个来源获取userId
    let userId = req.user?.id || req.body.userId || req.body.user_id;
    
    // 检查查询参数
    if (!userId && req.query && req.query.user_id) {
      userId = parseInt(req.query.user_id);
      console.log('从查询参数获取用户ID:', userId);
    }
    
    const { cardNumber, expiry, cvv } = req.body;
    
    // 检查必要字段
    if (!userId || !cardNumber || !expiry || !cvv) {
      console.error('缺少必要字段:', { userId, hasCardNumber: !!cardNumber, hasExpiry: !!expiry, hasCvv: !!cvv });
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    console.log('处理支付方式, 用户ID:', userId);
    
    // 获取卡号后四位
    const last4 = cardNumber.slice(-4);
    
    // 获取过期月份和年份
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
    
    // 创建一个随机令牌ID
    const tokenizedCardId = `tok_${Math.random().toString(36).substring(2, 15)}`;
    
    // 检查卡是否已存在
    const existingCard = await db('user_payment_methods')
      .where({ 
        user_id: userId,
        last4: last4,
        card_type: cardType,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10) + 2000 // 年份处理
      })
      .first();
    
    if (existingCard) {
      return res.json({ 
        success: true, 
        message: '支付方式已存在',
        paymentMethodId: existingCard.id,
        id: existingCard.id,
        tokenized_card_id: existingCard.tokenized_card_id,
        card_type: existingCard.card_type,
        last4: existingCard.last4
      });
    }
    
    let id;
    try {
      // 保存支付方式到数据库
      const paymentData = {
        user_id: userId,
        payment_provider: 'Stripe',
        tokenized_card_id: tokenizedCardId,
        last4: last4,
        card_type: cardType,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10) + 2000, // 加2000得到完整年份
        cvv: cvv,
        created_at: new Date()
      };
      
      console.log('插入支付方式数据:', paymentData);
      
      // 插入数据库
      const result = await db('user_payment_methods').insert(paymentData);
      id = result[0];
      
      console.log('支付方式添加成功，ID:', id);
      
      res.status(201).json({ 
        message: '支付方式添加成功',
        id: id,
        tokenized_card_id: tokenizedCardId,
        card_type: cardType,
        last4: last4
      });
    } catch (error) {
      console.error('保存支付方式错误:', error);
      // 记录详细错误信息
      if (error.code) console.error('错误码:', error.code);
      if (error.errno) console.error('错误编号:', error.errno);
      if (error.sql) console.error('SQL:', error.sql);
      
      res.status(500).json({ error: '内部服务器错误', details: error.message });
    }
  } catch (error) {
    console.error('保存支付方式错误:', error);
    res.status(500).json({ error: '保存支付方式失败' });
  }
};

// handle Stripe Webhook
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
  
  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    try {
      // Update payment intent status
      await db('payment_intents')
        .where({ stripe_payment_intent_id: paymentIntent.id })
        .update({ 
          status: 'succeeded',
          updated_at: new Date()
        });
      
      // Get metadata
      const { itemId, userId } = paymentIntent.metadata;
      
      // Create payment record
      await db('payments').insert({
        user_id: userId,
        item_id: itemId,
        amount: paymentIntent.amount / 100,
        status: 'Completed',
        stripe_payment_id: paymentIntent.id,
        payment_time: new Date()
      });
      
      // Update item status
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
  
  // Handle payment failure
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

// Get user's payment methods
const getUserPaymentMethods = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const paymentMethods = await db('user_payment_methods')
      .where({ user_id: userId })
      .select('id', 'last4', 'card_type', 'exp_month', 'exp_year', 'created_at');
    
    // Format payment methods
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

// Process payment
const processPayment = async (req, res) => {
  try {
    const { userId, itemId, paymentMethodId, amount } = req.body;
    
    // Check for missing fields
    if (!userId || !itemId || !paymentMethodId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // get payment method
    const paymentMethod = await db('user_payment_methods')
      .where({ id: paymentMethodId, user_id: userId })
      .first();
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // get item
    const item = await db('items')
      .where({ id: itemId })
      .first();
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // check if auction is active
    if (item.auction_status !== 'Active') {
      return res.status(400).json({ error: 'This auction is not active' });
    }
    
    // check if auction has ended
    // simulate payment processing
    const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
    const paymentStatus = 'Completed';
    
    // create payment record
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
    
    // update item status
    await db('items')
      .where({ id: itemId })
      .update({ 
        auction_status: 'Ended - Sold',
        updated_at: new Date()
      });
    
    // send notifications
    await db('notifications').insert({
      user_id: item.user_id,
      message: `Your item "${item.title}" has been sold for $${amount}`,
      read: false,
      created_at: new Date()
    });
    
    await db('notifications').insert({
      user_id: userId, 
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

// get user's payment history
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

// get payment details
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

// get item payment status
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

// router
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);
router.post('/save-payment-method', authenticateToken, savePaymentMethod);
router.post('/process-payment', authenticateToken, processPayment);
router.get('/payment-methods/:userId', authenticateToken, getUserPaymentMethods);
router.get('/payment-history/:userId', authenticateToken, getUserPaymentHistory);
router.get('/payment/:paymentId', authenticateToken, getPaymentDetails);
router.get('/item-payment-status/:itemId', getItemPaymentStatus);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// add payment method
router.post('/methods', authenticateToken, async (req, res) => {
  try {
    // 记录请求信息，帮助调试
    console.log('The request to add payment method was received:', new Date().toISOString());
    console.log('Request body:', req.body);
    
    // 尝试从令牌或请求体获取用户 ID
    let userId;
    
    // 首先尝试从令牌获取
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        // 尝试所有可能的JWT密钥
        console.log('Attempting to verify token with multiple possible keys');
        
        // 与.env中的密钥保持一致
        const SECRET_KEY = process.env.SECRET_KEY || 'JH7g5Ff9KmNp3Qz8Xw6RdC2Vb1At0Er4';
        
        // 尝试其他可能使用的密钥
        const possibleKeys = [
          SECRET_KEY,
          'your-secret-key',
          'JH7g5Ff9KmNp3Qz8Xw6RdC2Vb1At0Er4'
        ];
        
        // 打印密钥前缀进行调试
        console.log('Using SECRET_KEY:', SECRET_KEY.substring(0, 3) + '...');
        
        let decoded;
        let verificationSuccessful = false;
        
        // 尝试所有可能的密钥
        for (const key of possibleKeys) {
          if (!key) continue;
          
          try {
            console.log('Trying key:', key.substring(0, 3) + '...');
            decoded = jwt.verify(token, key);
            userId = decoded.id;
            console.log('Successfully verified token with key starting with', key.substring(0, 3));
            verificationSuccessful = true;
            break;
          } catch (err) {
            console.log('Verification failed with key starting with', key.substring(0, 3));
            // 继续尝试下一个密钥
          }
        }
        
        if (!verificationSuccessful) {
          throw new Error('Token verification failed with all keys');
        }
      } catch (tokenError) {
        console.error('All token verification attempts failed:', tokenError.message);
        
        // 降级处理
        if (req.body.user_id) {
          userId = req.body.user_id;
          console.log('Using fallback user_id from request body:', userId);
        } else {
          return res.status(403).json({ error: 'Token verification failed' });
        }
      }
    } else if (req.body.user_id) {
      // 如果没有令牌，尝试从请求体获取用户 ID
      if (process.env.NODE_ENV !== 'production') {
        userId = req.body.user_id;
        console.log('No token provided, using user_id from request body in dev mode:', userId);
      } else {
        return res.status(401).json({ error: 'No authentication token provided' });
      }
    } else {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // 添加合并前的代码逻辑
    const { tokenized_card_id, card_type, last4, exp_month, exp_year, cvv } = req.body;
    
    console.log('Validated request data:', { 
      userId, 
      tokenized_card_id, 
      card_type, 
      last4, 
      exp_month, 
      exp_year 
    });
    
    // 检查是否已存在相同的支付方式
    const existingMethod = await db('user_payment_methods')
      .where({ user_id: userId, last4 })
      .first();
    
    if (existingMethod) {
      return res.json({ 
        message: 'Payment method already exists', 
        id: existingMethod.id 
      });
    }
    
    // 准备插入数据
    const paymentData = {
      user_id: userId,
      payment_provider: 'Stripe',
      tokenized_card_id: tokenized_card_id || `tok_${Math.random().toString(36).substring(2, 15)}`,
      last4,
      card_type,
      exp_month,
      exp_year,
      cvv,
      created_at: db.fn.now()
    };
    
    console.log('Preparing to insert data');
    
    // 插入新支付方式
    const [id] = await db('user_payment_methods').insert(paymentData);
    
    console.log(`User ${userId} added a new payment method:`, { id, card_type, last4 });
    
    return res.status(201).json({ 
      message: 'Payment method added successfully', 
      id, 
      tokenized_card_id: paymentData.tokenized_card_id,
      card_type,
      last4,
      exp_month,
      exp_year
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

// 获取用户的支付方式
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Getting payment methods for user ${userId}`);
    
    // 查询用户的支付方式
    const payments = await db('user_payment_methods')
      .where({ user_id: userId })
      .select('id', 'user_id', 'tokenized_card_id', 'last4', 'card_type', 'exp_month', 'exp_year', 'created_at');
    
    // 格式化响应
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      user_id: payment.user_id,
      payment_method_id: payment.tokenized_card_id, // 为了保持向后兼容
      tokenized_card_id: payment.tokenized_card_id,
      last4: payment.last4,
      brand: payment.card_type, // 前端代码可能在使用brand
      card_type: payment.card_type,
      exp_month: payment.exp_month,
      exp_year: payment.exp_year,
      created_at: payment.created_at
    }));
    
    console.log(`Got payment methods for user ${userId}:`, formattedPayments);
    
    return res.json(formattedPayments);
  } catch (error) {
    console.error('Error obtaining payment method:', error);
    return res.status(500).json({ error: 'Error obtaining payment method' });
  }
});

module.exports = router; 