const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Connection = require('../models/Connection');

const activeUsers = new Map(); // userId -> Set of socketIds

const initializeSocketIO = (io) => {
  io.use((socket, next) => {
    // Socket authentication middleware (supports handshake auth token or cookie)
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'dev_secret_fallback_key'
        );
        socket.userId = decoded.id;
      } catch (err) {
        // Token invalid, allow anonymous or fallback
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // 1. User Registration & Online Presence
    socket.on('register_user', (userId) => {
      const uid = userId || socket.userId;
      if (!uid) return;

      socket.userId = uid;
      socket.join(`user_${uid}`);

      if (!activeUsers.has(uid)) {
        activeUsers.set(uid, new Set());
      }
      activeUsers.get(uid).add(socket.id);

      // Broadcast user is online
      io.emit('user_presence', {
        userId: uid,
        status: 'online',
        activeUsers: Array.from(activeUsers.keys()),
      });
    });

    // 2. Request current online users list
    socket.on('get_online_users', () => {
      socket.emit('online_users_list', Array.from(activeUsers.keys()));
    });

    // 3. Join Conversation Room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    // 4. Leave Conversation Room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // 5. Typing Indicators
    socket.on('typing_start', ({ conversationId, peerId }) => {
      socket.to(`conv_${conversationId}`).emit('peer_typing', {
        conversationId,
        userId: socket.userId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId, peerId }) => {
      socket.to(`conv_${conversationId}`).emit('peer_typing', {
        conversationId,
        userId: socket.userId,
        isTyping: false,
      });
    });

    // 6. Direct Message Broadcast
    socket.on('send_direct_message', async (messageData) => {
      const { conversationId, receiverId, text } = messageData;
      if (!socket.userId || !receiverId || !text) return;

      try {
        // Save to DB
        const newMessage = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          receiver: receiverId,
          text,
        });

        await Connection.findByIdAndUpdate(conversationId, {
          lastActivityAt: new Date(),
        });

        const populated = await Message.findById(newMessage._id).populate(
          'sender',
          'name username profileImage'
        );

        // Broadcast to conversation room
        io.to(`conv_${conversationId}`).emit('new_message', populated);

        // Also notify receiver's personal room
        io.to(`user_${receiverId}`).emit('message_notification', {
          conversationId,
          message: populated,
        });
      } catch (err) {
        console.error('[Socket Message Error]', err);
      }
    });

    // 7. Disconnection
    socket.on('disconnect', () => {
      if (socket.userId && activeUsers.has(socket.userId)) {
        const userSocketSet = activeUsers.get(socket.userId);
        userSocketSet.delete(socket.id);

        if (userSocketSet.size === 0) {
          activeUsers.delete(socket.userId);
          // Broadcast user went offline
          io.emit('user_presence', {
            userId: socket.userId,
            status: 'offline',
            activeUsers: Array.from(activeUsers.keys()),
          });
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSocketIO, activeUsers };
