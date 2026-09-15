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
      .populate('users', 'name username profileImage rating occupation location')
      .populate('sharedSkills', 'name category icon')
      .sort({ lastActivityAt: -1 });

    // Attach peer user and last message preview for each connection
    const formattedConnections = await Promise.all(
      connections.map(async (conn) => {
        const peer = conn.users.find(
          (u) => u._id.toString() !== req.user.id
        );

        const lastMessage = await Message.findOne({ conversation: conn._id })
          .sort({ createdAt: -1 })
          .select('text sender createdAt read');

        return {
          _id: conn._id,
          peer,
          sharedSkills: conn.sharedSkills,
          status: conn.status,
          lastActivityAt: conn.lastActivityAt,
          lastMessage,
          createdAt: conn.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedConnections.length,
      data: formattedConnections,
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
      .populate('users', 'name username profileImage bio rating occupation location skillsToTeach skillsToLearn availability')
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
