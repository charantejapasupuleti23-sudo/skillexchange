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
    // Join a unique user room upon authentication/connection
    const initialUserId =
      socket.userId ||
      socket.handshake.query?.userId ||
      socket.handshake.auth?.userId;

    if (initialUserId) {
      const uidStr = initialUserId.toString();
      socket.userId = uidStr;
      socket.join(uidStr);
      socket.join(`user_${uidStr}`);
    }

    // 1. User Registration & Online Presence
    socket.on('register_user', (userId) => {
      const uid = (userId || socket.userId || '').toString();
      if (!uid) return;

      socket.userId = uid;
      socket.join(uid);
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
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
      }
    });

    // 4. Leave Conversation Room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // 5. Typing Indicators
    socket.on('typing_start', ({ conversationId, peerId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).emit('peer_typing', {
          conversationId,
          userId: socket.userId,
          isTyping: true,
        });
      }
      if (peerId) {
        socket.to(peerId.toString()).to(`user_${peerId}`).emit('peer_typing', {
          conversationId,
          userId: socket.userId,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ conversationId, peerId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).emit('peer_typing', {
          conversationId,
          userId: socket.userId,
          isTyping: false,
        });
      }
      if (peerId) {
        socket.to(peerId.toString()).to(`user_${peerId}`).emit('peer_typing', {
          conversationId,
          userId: socket.userId,
          isTyping: false,
        });
      }
    });

    // 6. Send Message handler (room-scoped, targeted to receiver and sender)
    socket.on('send_message', async (data) => {
      const senderId = (socket.userId || data.senderId || data.sender || '').toString();
      const receiverId = (data.receiverId || data.receiver || '').toString();
      const content = data.content || data.text || '';
      const type = data.type || data.messageType || 'text';
      const conversationId = data.conversationId || data.conversation;

      if (!senderId || !receiverId || (!content && !data.codeSnippet && !data.fileAttachment && !data.sessionProposal)) {
        return;
      }

      try {
        // Save to DB
        const newMsg = await Message.create({
          conversation: conversationId || undefined,
          sender: senderId,
          receiver: receiverId,
          senderId,
          receiverId,
          text: content,
          content,
          messageType: type,
          type,
          codeSnippet: data.codeSnippet,
          fileAttachment: data.fileAttachment,
          sessionProposal: data.sessionProposal,
        });

        if (conversationId) {
          await Connection.findByIdAndUpdate(conversationId, {
            lastActivityAt: new Date(),
          });
        }

        const populated = await Message.findById(newMsg._id)
          .populate('sender', 'name username profileImage')
          .populate('receiver', 'name username profileImage');

        // Emit ONLY to receiver and sender rooms, NOT globally to everyone
        let target = io.to(receiverId).to(`user_${receiverId}`).to(senderId).to(`user_${senderId}`);
        if (conversationId) {
          target = target.to(`conv_${conversationId}`);
        }
        target.emit('receive_message', populated);

        io.to(receiverId).to(`user_${receiverId}`).emit('message_notification', {
          conversationId,
          message: populated,
        });
      } catch (err) {
        console.error('[Socket send_message error]', err);
      }
    });

    // 7. Direct Message Broadcast
    socket.on('send_direct_message', async (messageData) => {
      const senderId = (socket.userId || messageData.senderId || messageData.sender || '').toString();
      const receiverId = (messageData.receiverId || messageData.receiver || '').toString();
      const text = messageData.text || messageData.content;
      const conversationId = messageData.conversationId || messageData.conversation;

      if (!senderId || !receiverId || !text) return;

      try {
        // Save to DB
        const newMessage = await Message.create({
          conversation: conversationId || undefined,
          sender: senderId,
          receiver: receiverId,
          senderId,
          receiverId,
          text,
          content: text,
        });

        if (conversationId) {
          await Connection.findByIdAndUpdate(conversationId, {
            lastActivityAt: new Date(),
          });
        }

        const populated = await Message.findById(newMessage._id)
          .populate('sender', 'name username profileImage')
          .populate('receiver', 'name username profileImage');

        // Scoped emits only to participants
        let target = io.to(receiverId).to(`user_${receiverId}`).to(senderId).to(`user_${senderId}`);
        if (conversationId) {
          target = target.to(`conv_${conversationId}`);
        }
        target.emit('receive_message', populated);

        io.to(receiverId).to(`user_${receiverId}`).emit('message_notification', {
          conversationId,
          message: populated,
        });
      } catch (err) {
        console.error('[Socket Direct Message Error]', err);
      }
    });

    // 8. Disconnection
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
