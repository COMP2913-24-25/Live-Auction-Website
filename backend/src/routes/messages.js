const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

// Get all conversations of a user
router.get('/conversations', async (req, res) => {
  console.log('Received get conversation list request');
  console.log('Authentication header:', req.headers.authorization);
  console.log('Current user:', req.user);
  
  try {
    // Temporarily comment out authentication check (only for testing)
    /*
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Need to login' });
    }
    */
    
    // Set a test user ID (only for testing)
    const userId = req.user ? req.user.id : 1;  // Use ID 1 as default user
    
    // Query all conversations of a user
    const conversations = await knex('conversations')
      .where('user_id', userId)
      .orWhere('expert_id', userId)
      .orderBy('last_message_time', 'desc')
      .select('*');
    
    // Get the last message and conversation object information for each conversation
    for (let convo of conversations) {
      // Get the last message
      const lastMessage = await knex('messages')
        .where('conversation_id', convo.id)
        .orderBy('created_at', 'desc')
        .first();
      
      convo.last_message = lastMessage || null;
      
      // Get the other party user information
      const otherUserId = userId === convo.user_id ? convo.expert_id : convo.user_id;
      const otherUser = await knex('users')
        .where('id', otherUserId)
        .select('id', 'username')
        .first();
      
      convo.other_user = otherUser;
    }
    
    return res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversation list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Get conversation list failed'
    });
  }
});

// Get the message history of a specific conversation
router.get('/conversations/:id/messages', async (req, res) => {
  console.log('Get conversation messages request:', req.params.id);
  console.log('Authentication header:', req.headers.authorization);
  console.log('Current user:', req.user);
  
  try {
    // Temporarily comment out authentication check (only for testing)
    /*
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Need to login' });
    }
    */
    
    // Set a test user ID (only for testing)
    const userId = req.user ? req.user.id : 1;  // Use ID 1 as default user
    
    const conversationId = req.params.id;
    
    // Check if the user is a participant in the conversation - temporarily close this check for testing
    const conversation = await knex('conversations')
      .where('id', conversationId)
      .first();
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    // Get the message list
    const messages = await knex('messages')
      .where('conversation_id', conversationId)
      .orderBy('created_at', 'asc')
      .select('*');
    
    // Mark messages sent to the current user as read
    await knex('messages')
      .where('conversation_id', conversationId)
      .andWhere('receiver_id', userId)
      .andWhere('is_read', false)
      .update({ is_read: true });
    
    return res.json({
      success: true,
      messages,
      conversation
    });
  } catch (error) {
    console.error('Get message history detailed error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Get message history failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send a new message
router.post('/messages', async (req, res) => {
  console.log('Received send message request, user information:', req.user);
  console.log('Authentication header:', req.headers.authorization);
  
  try {
    // Force the current logged-in user's ID to be the sender
    const senderId = req.user ? req.user.id : 1;  // Keep default to 1, but use current user ID if available
    console.log('Sending message, using senderId:', senderId);
    
    const { conversation_id, receiver_id, content } = req.body;
    console.log('Request data:', { conversation_id, receiver_id, content });
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message content cannot be empty'
      });
    }
    
    let conversationId = conversation_id;
    
    // If there is no conversation ID, a new conversation needs to be created
    if (!conversationId) {
      if (!receiver_id) {
        return res.status(400).json({
          success: false,
          error: 'Need to provide receiver ID or conversation ID'
        });
      }
      
      // Determine the user and expert roles
      const senderRole = req.user ? req.user.role : 1; // If there is no user, default to regular user role
      
      // Assume role=1 is regular user, role=2 is expert
      const userId = senderRole === 1 ? senderId : receiver_id;
      const expertId = senderRole === 2 ? senderId : receiver_id;
      
      // Check if a conversation already exists
      let existingConversation = await knex('conversations')
        .where(function() {
          this.where(function() {
            this.where('user_id', userId).andWhere('expert_id', expertId);
          });
        })
        .first();
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create a new conversation
        const [newId] = await knex('conversations').insert({
          user_id: userId,
          expert_id: expertId,
          last_message_time: knex.fn.now(),
          status: 'active',
          created_at: knex.fn.now()
        });
        
        conversationId = newId;
      }
    }
    
    // Create a new message - ensure using the correct senderId
    const [messageId] = await knex('messages').insert({
      sender_id: senderId,  // Use the determined senderId
      receiver_id,
      content,
      conversation_id: conversationId,
      created_at: knex.fn.now(),
      is_read: false
    });
    
    // Update the last message time of the conversation
    await knex('conversations')
      .where('id', conversationId)
      .update({
        last_message_time: knex.fn.now(),
        status: 'active'
      });
    
    // Print full information when returning data
    const message = await knex('messages')
      .where('id', messageId)
      .first();
    
    console.log('Created message:', message);
    
    return res.json({
      success: true,
      message,
      conversation_id: conversationId
    });
  } catch (error) {
    console.error('Send message detailed error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request data:', req.body);
    return res.status(500).json({
      success: false,
      error: 'Send message failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 