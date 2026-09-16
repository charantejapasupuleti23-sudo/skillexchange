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

// @desc    Send a message (text, code snippet, file link, or session proposal)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const {
      connectionId,
      receiverId,
      text,
      messageType = 'text',
      codeSnippet,
      fileAttachment,
      sessionProposal,
    } = req.body;

    if (!connectionId || !receiverId) {
      return next(new ErrorResponse('Please provide connectionId and receiverId', 400));
    }

    if (!text && !codeSnippet?.code && !fileAttachment?.url && !sessionProposal?.skillName) {
      return next(new ErrorResponse('Message cannot be completely empty', 400));
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
      text: text?.trim() || '',
      messageType,
      codeSnippet: codeSnippet || undefined,
      fileAttachment: fileAttachment || undefined,
      sessionProposal: sessionProposal || undefined,
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

    // Determine notification preview text
    let previewText = text;
    if (messageType === 'code') previewText = 'Shared a code snippet';
    else if (messageType === 'file') previewText = `Shared a file: ${fileAttachment?.name || 'Attachment'}`;
    else if (messageType === 'session_proposal') previewText = `Proposed a session: ${sessionProposal?.skillName || 'Practice'}`;

    // Send in-app notification to receiver
    await createNotification(io, {
      recipient: receiverId,
      sender: req.user.id,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.name}: "${previewText?.length > 50 ? previewText.substring(0, 47) + '...' : previewText}"`,
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

// @desc    Respond to in-chat session proposal (Accept / Decline)
// @route   PUT /api/messages/:id/respond-proposal
// @access  Private
exports.respondToProposal = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    if (message.receiver.toString() !== req.user.id) {
      return next(new ErrorResponse('Only the recipient can respond to this session proposal', 403));
    }

    if (message.messageType !== 'session_proposal' || !message.sessionProposal) {
      return next(new ErrorResponse('This message is not a session proposal', 400));
    }

    const Session = require('../models/Session');
    const { generateGoogleMeetLink } = require('../utils/meetingLink');

    if (status === 'accepted') {
      const prop = message.sessionProposal;
      const meetLink = prop.meetingLink || generateGoogleMeetLink();

      const session = await Session.create({
        connection: message.conversation,
        teacher: prop.teacher || message.sender,
        learner: prop.learner || message.receiver,
        skill: prop.skillId || undefined,
        skillName: prop.skillName || 'Skill Session',
        date: prop.date ? new Date(prop.date) : new Date(),
        startTime: prop.startTime || '18:00',
        endTime: prop.endTime || '19:00',
        meetingLink: meetLink,
        notes: prop.notes || 'Scheduled via in-chat proposal card.',
        status: 'scheduled',
      });

      message.sessionProposal.status = 'accepted';
      message.sessionProposal.meetingLink = meetLink;
      message.sessionProposal.session = session._id;
      await message.save();

      const io = req.app.get('io');
      if (io) {
        await createNotification(io, {
          recipient: message.sender,
          sender: req.user.id,
          type: 'session_scheduled',
          title: 'Session Proposal Accepted! 🎉',
          message: `${req.user.name} accepted your session proposal. Join Google Meet when ready!`,
          referenceId: session._id,
          referenceType: 'Session',
        });
      }
    } else {
      message.sessionProposal.status = 'declined';
      await message.save();
    }

    const populated = await Message.findById(message._id)
      .populate('sender', 'name username profileImage')
      .populate('receiver', 'name username profileImage');

    const io = req.app.get('io');
    if (io) {
      io.to(`conv_${message.conversation}`).emit('message_updated', populated);
    }

    res.status(200).json({
      success: true,
      message: `Session proposal ${status}`,
      data: populated,
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
