const Session = require('../models/Session');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Skill = require('../models/Skill');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');

// @desc    Schedule a new learning session
// @route   POST /api/sessions
// @access  Private
exports.createSession = async (req, res, next) => {
  try {
    const {
      connectionId,
      teacherId,
      learnerId,
      skillId,
      date,
      startTime,
      endTime,
      meetingLink,
      notes,
    } = req.body;

    if (!connectionId || !teacherId || !learnerId || !skillId || !date || !startTime || !endTime) {
      return next(new ErrorResponse('Please provide all required session details', 400));
    }

    // Verify connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return next(new ErrorResponse('Connection not found', 404));
    }

    const isMember = connection.users.some((u) => u.toString() === req.user.id);
    if (!isMember) {
      return next(new ErrorResponse('You are not authorized to schedule a session for this connection', 403));
    }

    // Prevent scheduling in the past
    const sessionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      return next(new ErrorResponse('Cannot schedule a session for a date in the past', 400));
    }

    // Determine other party for notification
    const otherUserId = req.user.id === teacherId ? learnerId : teacherId;

    const session = await Session.create({
      connection: connectionId,
      teacher: teacherId,
      learner: learnerId,
      skill: skillId,
      date: sessionDate,
      startTime,
      endTime,
      meetingLink: meetingLink || 'https://meet.skillloop.dev/session-' + Math.random().toString(36).substring(2, 9),
      notes: notes || '',
      status: 'Pending',
    });

    const populatedSession = await Session.findById(session._id)
      .populate('teacher', 'name username profileImage rating')
      .populate('learner', 'name username profileImage rating')
      .populate('skill', 'name category icon');

    // Notify the other party
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_scheduled',
      title: 'New Session Scheduled',
      message: `${req.user.name} requested a learning session for ${populatedSession.skill.name} on ${new Date(date).toLocaleDateString()} at ${startTime}.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(201).json({
      success: true,
      message: 'Learning session scheduled successfully',
      data: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions for current user (as teacher or learner)
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const query = {
      $or: [{ teacher: req.user.id }, { learner: req.user.id }],
    };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (role === 'teacher') {
      delete query.$or;
      query.teacher = req.user.id;
    } else if (role === 'learner') {
      delete query.$or;
      query.learner = req.user.id;
    }

    const sessions = await Session.find(query)
      .populate('teacher', 'name username profileImage rating')
      .populate('learner', 'name username profileImage rating')
      .populate('skill', 'name category icon')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single session by ID
// @route   GET /api/sessions/:id
// @access  Private
exports.getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teacher', 'name username profileImage rating bio occupation')
      .populate('learner', 'name username profileImage rating bio occupation')
      .populate('skill', 'name category icon description');

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher._id.toString() === req.user.id ||
      session.learner._id.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to access this session', 403));
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a scheduled session
// @route   PUT /api/sessions/:id/accept
// @access  Private
exports.acceptSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('learner', 'name')
      .populate('skill', 'name');

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher._id.toString() === req.user.id ||
      session.learner._id.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to accept this session', 403));
    }

    if (session.status !== 'Pending') {
      return next(new ErrorResponse(`Cannot accept session with status "${session.status}"`, 400));
    }

    session.status = 'Confirmed';
    await session.save();

    const otherUserId =
      session.teacher._id.toString() === req.user.id
        ? session.learner._id
        : session.teacher._id;

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_confirmed',
      title: 'Session Confirmed!',
      message: `${req.user.name} confirmed the upcoming ${session.skill.name} session.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session confirmed successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a scheduled session
// @route   PUT /api/sessions/:id/reject
// @access  Private
exports.rejectSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher.toString() === req.user.id ||
      session.learner.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to modify this session', 403));
    }

    if (session.status !== 'Pending') {
      return next(new ErrorResponse(`Cannot reject a session that is already "${session.status}"`, 400));
    }

    session.status = 'Rejected';
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session proposal declined',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
exports.cancelSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher.toString() === req.user.id ||
      session.learner.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to modify this session', 403));
    }

    if (!['Pending', 'Confirmed'].includes(session.status)) {
      return next(new ErrorResponse(`Cannot cancel a session that is already "${session.status}"`, 400));
    }

    session.status = 'Cancelled';
    await session.save();

    const otherUserId =
      session.teacher.toString() === req.user.id ? session.learner : session.teacher;

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `${req.user.name} cancelled the scheduled session.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session cancelled',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark session as completed and update progress & stats
// @route   PUT /api/sessions/:id/complete
// @access  Private
exports.completeSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher.toString() === req.user.id ||
      session.learner.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to complete this session', 403));
    }

    if (session.status === 'Completed') {
      return next(new ErrorResponse('Session is already marked completed', 400));
    }

    if (session.status !== 'Confirmed') {
      return next(new ErrorResponse(`Only a Confirmed session can be marked Completed (current status: "${session.status}")`, 400));
    }

    session.status = 'Completed';
    session.progressUpdated = true;
    await session.save();

    // Increment Teacher's completedSessions & learnersHelped
    await User.findByIdAndUpdate(session.teacher, {
      $inc: { completedSessions: 1, learnersHelped: 1 },
    });

    // Increment Learner's skill progress & completed sessions
    const learner = await User.findById(session.learner);
    if (learner) {
      const skillItem = learner.skillsToLearn.find(
        (item) => item.skill.toString() === session.skill.toString()
      );

      if (skillItem) {
        skillItem.sessionsCompleted = (skillItem.sessionsCompleted || 0) + 1;
        skillItem.progress = Math.min(100, (skillItem.progress || 0) + 15);
        skillItem.lastLearned = new Date();
        await learner.save();
      }
    }

    const io = req.app.get('io');
    const otherUserId =
      session.teacher.toString() === req.user.id ? session.learner : session.teacher;

    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_completed',
      title: 'Session Completed!',
      message: `The session has been marked completed. You can now leave a review!`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
