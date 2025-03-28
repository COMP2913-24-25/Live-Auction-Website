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
const { authenticateToken } = require('../middleware/auth');

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
    const { userId, cardNumber, expiry, cvv } = req.body;
    
    // Check for missing fields
    if (!userId || !cardNumber || !expiry || !cvv) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get last 4 digits of card number
    const last4 = cardNumber.slice(-4);
    
    // Get expiry month and year
    const [expMonth, expYear] = expiry.split('/');
    
    // check card type
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
    
    // Create a tokenized card ID
    const tokenizedCardId = `tok_${Math.random().toString(36).substring(2, 15)}`;
    
    // Check if card already exists
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
    
    let id;
    try {
      // Save payment method to database
      const result = await db('user_payment_methods').insert({
        user_id: req.user.id,
        payment_provider: 'Stripe',
        tokenized_card_id,
        last4,
        card_type: cardType,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10) + 2000, // Add 2000 to get full year
        cvv: cvv,
        created_at: new Date()
      });
      
      // Get the ID of the inserted record
      id = result[0];
      
      console.log('Database insertion successful, ID:', id);
      
      res.status(201).json({ 
        message: 'Payment method added successfully',
        id: id
      });
    } catch (error) {
      console.error('Error saving payment method:', error);
      // Log detailed error information
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
    console.log('The request to add payment method was received:', new Date().toISOString());
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const { payment_provider, tokenized_card_id, last4, card_type, exp_month, exp_year, cvv } = req.body;
    
    // check for missing fields
    if (!payment_provider || !tokenized_card_id || !last4 || !card_type || !exp_month || !exp_year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // add payment method
    const [paymentMethodId] = await db('user_payment_methods').insert({
      user_id: req.user.id,
      payment_provider,
      tokenized_card_id,
      last4,
      card_type,
      exp_month,
      exp_year,
      cvv: cvv || '000' 
    });
    
    console.log('Payment method added successfully, ID:', paymentMethodId);
    
    res.status(201).json({ 
      id: paymentMethodId,
      message: 'Payment method added successfully' 
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    // Log detailed error information
    if (error.code) console.error('Error code:', error.code);
    if (error.errno) console.error('Error number:', error.errno);
    if (error.sql) console.error('SQL:', error.sql);
    
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get('/methods', authenticateToken, async (req, res) => {
  try {
    // Fetch payment methods
    const paymentMethods = await db('user_payment_methods')
      .where({ user_id: req.user.id })
      .select('id', 'payment_provider', 'last4', 'card_type', 'exp_month', 'exp_year', 'created_at');
    
    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 