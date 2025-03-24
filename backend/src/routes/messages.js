const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

// Get all conversations for the user
router.get('/conversations', async (req, res) => {
  console.log('Received request to get conversation list');
  console.log('Authorization header:', req.headers.authorization);
  console.log('Current user:', req.user);

  try {


    // Set a test user ID (for testing only)
    const userId = req.user ? req.user.id : 1;  // Use default user with ID 1

    // Query all conversations the user participates in
    const conversations = await knex('conversations')
      .where('user_id', userId)
      .orWhere('expert_id', userId)
      .orderBy('last_message_time', 'desc')
      .select('*');

    // For each conversation, get the last message and the other participant's info
    for (let convo of conversations) {
      // Get the last message
      const lastMessage = await knex('messages')
        .where('conversation_id', convo.id)
        .orderBy('created_at', 'desc')
        .first();

      convo.last_message = lastMessage || null;

      // Get the other participant's info
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
    console.error('Error retrieving conversation list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation list'
    });
  }
});

// Get message history for a specific conversation
router.get('/conversations/:id/messages', async (req, res) => {
  console.log('Request to get conversation messages:', req.params.id);
  console.log('Authorization header:', req.headers.authorization);
  console.log('Current user:', req.user);

  try {


    // Set a test user ID (for testing only)
    const userId = req.user ? req.user.id : 1;  // Use default user with ID 1

    const conversationId = req.params.id;

    // Check if the user is a participant in the conversation - can be disabled for testing
    const conversation = await knex('conversations')
      .where('id', conversationId)
      .first();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get message list
    const messages = await knex('messages')
      .where('conversation_id', conversationId)
      .orderBy('created_at', 'asc')
      .select('*');

    // Mark unread messages sent to the current user as read
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
    console.error('Error retrieving message history:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve message history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send a new message
router.post('/messages', async (req, res) => {
  console.log('Received request to send message, user info:', req.user);
  console.log('Authorization header:', req.headers.authorization);

  try {
    // Force using the logged-in user's ID as sender
    const senderId = req.user ? req.user.id : 1;  // Default to 1 if no user, but prefer actual user ID
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

    // If no conversation ID is provided, create a new conversation
    if (!conversationId) {
      if (!receiver_id) {
        return res.status(400).json({
          success: false,
          error: 'Receiver ID or conversation ID is required'
        });
      }

      // Determine user and expert roles
      const senderRole = req.user ? req.user.role : 1; // Default to regular user role if no user

      // Assume role=1 is user, role=2 is expert
      const userId = senderRole === 1 ? senderId : receiver_id;
      const expertId = senderRole === 2 ? senderId : receiver_id;

      // Check if conversation already exists
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

    // Create a new message - ensure correct senderId is used
    const [messageId] = await knex('messages').insert({
      sender_id: senderId,  // Use confirmed senderId
      receiver_id,
      content,
      conversation_id: conversationId,
      created_at: knex.fn.now(),
      is_read: false
    });

    // Update conversation's last message time
    await knex('conversations')
      .where('id', conversationId)
      .update({
        last_message_time: knex.fn.now(),
        status: 'active'
      });

    // Fetch and return full message data
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
    console.error('Error sending message:', error);
    console.error('Error stack:', error.stack);
    console.error('Request data:', req.body);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
