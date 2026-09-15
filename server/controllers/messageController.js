const Message = require('../models/Message');
const Connection = require('../models/Connection');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');

// @desc    Get message history for a connection
// @route   GET /api/messages/:connectionId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return next(new ErrorResponse('Connection not found', 404));
    }

    const isMember = connection.users.some(
      (u) => u.toString() === req.user.id
    );
    if (!isMember) {
      return next(new ErrorResponse('Not authorized to access messages for this connection', 403));
    }

    // Mark unread messages sent to req.user as read
    await Message.updateMany(
      {
        conversation: connectionId,
        receiver: req.user.id,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    const messages = await Message.find({ conversation: connectionId })
      .populate('sender', 'name username profileImage')
      .populate('receiver', 'name username profileImage')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a connection
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { connectionId, receiverId, text } = req.body;

    if (!connectionId || !receiverId || !text) {
      return next(new ErrorResponse('Please provide connectionId, receiverId, and text', 400));
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return next(new ErrorResponse('Connection not found', 404));
    }

    const isMember = connection.users.some(
      (u) => u.toString() === req.user.id
    );
    if (!isMember) {
      return next(new ErrorResponse('Not authorized to send messages in this connection', 403));
    }

    const message = await Message.create({
      conversation: connectionId,
      sender: req.user.id,
      receiver: receiverId,
      text: text.trim(),
    });

    // Update connection activity
    await Connection.findByIdAndUpdate(connectionId, {
      lastActivityAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profileImage')
      .populate('receiver', 'name username profileImage');

    // Socket real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(`conv_${connectionId}`).emit('new_message', populatedMessage);
      io.to(`user_${receiverId}`).emit('message_notification', {
        conversationId: connectionId,
        message: populatedMessage,
      });
    }

    // Send in-app notification to receiver
    await createNotification(io, {
      recipient: receiverId,
      sender: req.user.id,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.name}: "${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
      referenceId: connectionId,
      referenceType: 'Connection',
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark specific message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markMessageAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    if (message.receiver.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this message', 403));
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
