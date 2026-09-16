const ExchangeRequest = require('../models/ExchangeRequest');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Skill = require('../models/Skill');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');
const sendEmail = require('../utils/sendEmail');
const { exchangeRequestEmail, exchangeAcceptedEmail } = require('../utils/emailTemplates');

// @desc    Create and send a skill exchange request
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res, next) => {
  try {
    const { receiverId, teachSkillId, learnSkillId, message } = req.body;

    if (!receiverId || !teachSkillId || !learnSkillId) {
      return next(new ErrorResponse('Please specify the recipient, offered skill, and desired skill', 400));
    }

    if (receiverId === req.user.id) {
      return next(new ErrorResponse('You cannot send a skill exchange request to yourself', 400));
    }

    // Check receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(new ErrorResponse('Recipient user not found', 404));
    }

    // Check skills exist
    const [teachSkill, learnSkill] = await Promise.all([
      Skill.findById(teachSkillId),
      Skill.findById(learnSkillId),
    ]);

    if (!teachSkill || !learnSkill) {
      return next(new ErrorResponse('One or both selected skills do not exist', 404));
    }

    // Check for existing pending request between these two
    const existingPending = await ExchangeRequest.findOne({
      $or: [
        { sender: req.user.id, receiver: receiverId, status: 'Pending' },
        { sender: receiverId, receiver: req.user.id, status: 'Pending' },
      ],
    });

    if (existingPending) {
      return next(new ErrorResponse('There is already a pending exchange request between you and this user', 400));
    }

    // Create exchange request
    const request = await ExchangeRequest.create({
      sender: req.user.id,
      receiver: receiverId,
      teachSkill: teachSkillId,
      learnSkill: learnSkillId,
      message: message || `Hi! I would love to exchange skills: I can teach you ${teachSkill.name} and want to learn ${learnSkill.name}.`,
    });

    // Send notification to receiver
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: receiverId,
      sender: req.user.id,
      type: 'exchange_request_received',
      title: 'New Skill Exchange Request',
      message: `${req.user.name} offered to teach you ${teachSkill.name} in exchange for learning ${learnSkill.name}.`,
      referenceId: request._id,
      referenceType: 'ExchangeRequest',
    });

    // Send email to recipient if email exists
    if (receiver.email) {
      try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const html = exchangeRequestEmail({
          senderName: req.user.name,
          receiverName: receiver.name,
          teachSkill: teachSkill.name,
          learnSkill: learnSkill.name,
          message: request.message,
          clientUrl,
        });

        await sendEmail({
          email: receiver.email,
          subject: `SkillLoop: New Skill Exchange Request from ${req.user.name}`,
          message: `${req.user.name} wants to connect and exchange skills on SkillLoop (Teach: ${teachSkill.name}, Learn: ${learnSkill.name}).`,
          html,
        });
      } catch (emailErr) {
        console.error('[Email Error in createRequest]', emailErr.message);
      }
    }

    const populatedRequest = await ExchangeRequest.findById(request._id)
      .populate('sender', 'name username profileImage rating')
      .populate('receiver', 'name username profileImage rating')
      .populate('teachSkill', 'name category icon')
      .populate('learnSkill', 'name category icon');

    res.status(201).json({
      success: true,
      message: 'Skill exchange request sent successfully',
      data: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get received exchange requests
// @route   GET /api/requests/received
// @access  Private
exports.getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await ExchangeRequest.find({ receiver: req.user.id })
      .populate('sender', 'name username profileImage bio rating occupation location')
      .populate('teachSkill', 'name category icon')
      .populate('learnSkill', 'name category icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sent exchange requests
// @route   GET /api/requests/sent
// @access  Private
exports.getSentRequests = async (req, res, next) => {
  try {
    const requests = await ExchangeRequest.find({ sender: req.user.id })
      .populate('receiver', 'name username profileImage bio rating occupation location')
      .populate('teachSkill', 'name category icon')
      .populate('learnSkill', 'name category icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept exchange request
// @route   PUT /api/requests/:id/accept
// @access  Private
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id)
      .populate('sender', 'name username email')
      .populate('teachSkill', 'name')
      .populate('learnSkill', 'name');

    if (!request) {
      return next(new ErrorResponse('Exchange request not found', 404));
    }

    // Only receiver can accept
    if (request.receiver.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to accept this request', 403));
    }

    if (request.status !== 'Pending') {
      return next(new ErrorResponse(`Cannot accept request that is already ${request.status}`, 400));
    }

    request.status = 'Accepted';
    await request.save();

    // Check if connection already exists
    let connection = await Connection.findOne({
      users: { $all: [request.sender._id, request.receiver] },
    });

    if (!connection) {
      connection = await Connection.create({
        users: [request.sender._id, request.receiver],
        exchangeRequest: request._id,
        sharedSkills: [request.teachSkill._id, request.learnSkill._id],
        status: 'active',
      });
    } else {
      // Add shared skills if not present (use .some() for correct ObjectId equality)
      const teachSkillId = request.teachSkill._id.toString();
      const learnSkillId = request.learnSkill._id.toString();
      if (!connection.sharedSkills.some((id) => id.toString() === teachSkillId)) {
        connection.sharedSkills.push(request.teachSkill._id);
      }
      if (!connection.sharedSkills.some((id) => id.toString() === learnSkillId)) {
        connection.sharedSkills.push(request.learnSkill._id);
      }
      connection.status = 'active';
      await connection.save();
    }

    // Send notification to sender
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: request.sender._id,
      sender: req.user.id,
      type: 'exchange_request_accepted',
      title: 'Exchange Request Accepted!',
      message: `${req.user.name} accepted your skill exchange request! You are now connected.`,
      referenceId: connection._id,
      referenceType: 'Connection',
    });

    // Send email to sender informing them of connection
    if (request.sender?.email) {
      try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const html = exchangeAcceptedEmail({
          senderName: request.sender.name,
          accepterName: req.user.name,
          teachSkill: request.teachSkill.name,
          learnSkill: request.learnSkill.name,
          clientUrl,
        });

        await sendEmail({
          email: request.sender.email,
          subject: `SkillLoop: ${req.user.name} accepted your Skill Exchange request!`,
          message: `Great news! ${req.user.name} accepted your skill exchange request for ${request.teachSkill.name} & ${request.learnSkill.name}. You are now connected!`,
          html,
        });
      } catch (emailErr) {
        console.error('[Email Error in acceptRequest]', emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Exchange request accepted and connection established',
      data: {
        request,
        connectionId: connection._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject exchange request
// @route   PUT /api/requests/:id/reject
// @access  Private
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id);

    if (!request) {
      return next(new ErrorResponse('Exchange request not found', 404));
    }

    if (request.receiver.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to reject this request', 403));
    }

    if (request.status !== 'Pending') {
      return next(new ErrorResponse(`Cannot reject request that is already ${request.status}`, 400));
    }

    request.status = 'Rejected';
    await request.save();

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: request.sender,
      sender: req.user.id,
      type: 'exchange_request_rejected',
      title: 'Exchange Request Declined',
      message: `${req.user.name} declined your skill exchange proposal.`,
      referenceId: request._id,
      referenceType: 'ExchangeRequest',
    });

    res.status(200).json({
      success: true,
      message: 'Exchange request rejected',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a sent exchange request
// @route   DELETE /api/requests/:id
// @access  Private
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id);

    if (!request) {
      return next(new ErrorResponse('Exchange request not found', 404));
    }

    if (request.sender.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to cancel this request', 403));
    }

    if (request.status !== 'Pending') {
      return next(new ErrorResponse(`Cannot cancel request that is already ${request.status}`, 400));
    }

    request.status = 'Cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Exchange request cancelled',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
