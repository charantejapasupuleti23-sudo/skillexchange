const Connection = require('../models/Connection');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all connections for current user
// @route   GET /api/connections
// @access  Private
exports.getConnections = async (req, res, next) => {
  try {
    const connections = await Connection.find({
      users: req.user.id,
      status: 'active',
    })
      .populate({
        path: 'users',
        select: 'name username profileImage rating occupation location skillsToTeach skillsToLearn',
        populate: [
          { path: 'skillsToTeach.skill', select: 'name category icon' },
          { path: 'skillsToLearn.skill', select: 'name category icon' },
        ],
      })
      .populate('sharedSkills', 'name category icon')
      .sort({ lastActivityAt: -1 })
      .lean();

    // Attach peer user and last message preview for each connection
    const formattedConnections = (
      await Promise.all(
        connections.map(async (conn) => {
          const peer = conn.users.find(
            (u) => u && (u._id ? u._id.toString() : u.toString()) !== req.user.id
          );

          if (!peer) return null;

          const lastMessage = await Message.findOne({ conversation: conn._id })
            .sort({ createdAt: -1 })
            .select('text sender createdAt read')
            .lean();

          return {
            _id: conn._id,
            peer,
            sharedSkills: conn.sharedSkills || [],
            status: conn.status,
            lastActivityAt: conn.lastActivityAt,
            lastMessage,
            createdAt: conn.createdAt,
          };
        })
      )
    ).filter(Boolean);

    res.status(200).json({
      success: true,
      count: formattedConnections.length,
      data: formattedConnections,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create active connection with a target user (for direct messaging)
// @route   POST /api/connections
// @access  Private
exports.getOrCreateConnection = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return next(new ErrorResponse('Please provide targetUserId', 400));
    }

    if (targetUserId === req.user.id) {
      return next(new ErrorResponse('Cannot create connection with yourself', 400));
    }

    const User = require('../models/User');
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return next(new ErrorResponse('Target user not found', 404));
    }

    let connection = await Connection.findOne({
      users: { $all: [req.user.id, targetUserId] },
    })
      .populate({
        path: 'users',
        select: 'name username profileImage rating occupation location skillsToTeach skillsToLearn',
        populate: [
          { path: 'skillsToTeach.skill', select: 'name category icon' },
          { path: 'skillsToLearn.skill', select: 'name category icon' },
        ],
      })
      .populate('sharedSkills', 'name category icon');

    if (!connection) {
      const newConn = await Connection.create({
        users: [req.user.id, targetUserId],
        status: 'active',
      });

      connection = await Connection.findById(newConn._id)
        .populate({
          path: 'users',
          select: 'name username profileImage rating occupation location skillsToTeach skillsToLearn',
          populate: [
            { path: 'skillsToTeach.skill', select: 'name category icon' },
            { path: 'skillsToLearn.skill', select: 'name category icon' },
          ],
        })
        .populate('sharedSkills', 'name category icon');
    } else if (connection.status !== 'active') {
      connection.status = 'active';
      await connection.save();
    }

    const peer = connection.users.find(
      (u) => u && (u._id ? u._id.toString() : u.toString()) !== req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Connection established',
      data: {
        _id: connection._id,
        peer,
        sharedSkills: connection.sharedSkills || [],
        status: connection.status,
        lastActivityAt: connection.lastActivityAt,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single connection by ID
// @route   GET /api/connections/:id
// @access  Private
exports.getConnectionById = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.id)
      .populate({
        path: 'users',
        select: 'name username profileImage bio rating occupation location skillsToTeach skillsToLearn availability',
        populate: [
          { path: 'skillsToTeach.skill', select: 'name category icon description' },
          { path: 'skillsToLearn.skill', select: 'name category icon description' },
        ],
      })
      .populate('sharedSkills', 'name category icon description');

    if (!connection) {
      return next(new ErrorResponse('Connection not found', 404));
    }

    const isMember = connection.users.some(
      (u) => u._id.toString() === req.user.id
    );

    if (!isMember) {
      return next(new ErrorResponse('Not authorized to access this connection', 403));
    }

    const peer = connection.users.find(
      (u) => u._id.toString() !== req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        _id: connection._id,
        peer,
        sharedSkills: connection.sharedSkills,
        status: connection.status,
        lastActivityAt: connection.lastActivityAt,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect / archive connection
// @route   DELETE /api/connections/:id
// @access  Private
exports.disconnect = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return next(new ErrorResponse('Connection not found', 404));
    }

    const isMember = connection.users.some(
      (u) => u.toString() === req.user.id
    );

    if (!isMember) {
      return next(new ErrorResponse('Not authorized to modify this connection', 403));
    }

    connection.status = 'archived';
    await connection.save();

    res.status(200).json({
      success: true,
      message: 'Connection archived',
      data: connection,
    });
  } catch (error) {
    next(error);
  }
};
