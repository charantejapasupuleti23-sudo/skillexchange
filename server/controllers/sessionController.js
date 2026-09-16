const Session = require('../models/Session');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');
const { generateGoogleMeetLink } = require('../utils/meetingLink');
const sendEmail = require('../utils/sendEmail');
const { sessionScheduledEmail, sessionConfirmedEmail } = require('../utils/emailTemplates');

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

    // Use provided meeting link or auto-generate a valid Google Meet link
    const finalMeetingLink =
      meetingLink && meetingLink.trim().length > 0
        ? meetingLink.trim()
        : generateGoogleMeetLink();

    const session = await Session.create({
      connection: connectionId,
      teacher: teacherId,
      learner: learnerId,
      skill: skillId,
      date: sessionDate,
      startTime,
      endTime,
      meetingLink: finalMeetingLink,
      notes: notes || '',
      status: 'Pending',
    });

    const populatedSession = await Session.findById(session._id)
      .populate('teacher', 'name username email profileImage rating')
      .populate('learner', 'name username email profileImage rating')
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

    // Send email invitations with Google Meet link to both participants
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const formattedDate = new Date(date).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const teacher = populatedSession.teacher;
      const learner = populatedSession.learner;
      const skillName = populatedSession.skill.name;

      // Email to other party (recipient)
      const recipientUser = req.user.id === teacher._id.toString() ? learner : teacher;
      if (recipientUser?.email) {
        const recipientHtml = sessionScheduledEmail({
          recipientName: recipientUser.name,
          otherPartyName: req.user.name,
          skillName,
          teacherName: teacher.name,
          learnerName: learner.name,
          date: formattedDate,
          startTime,
          endTime,
          meetingLink: finalMeetingLink,
          notes: session.notes,
          clientUrl,
        });

        await sendEmail({
          email: recipientUser.email,
          subject: `SkillLoop Session Scheduled: ${skillName} (Google Meet Link)`,
          message: `A new learning session for ${skillName} has been scheduled on ${formattedDate} at ${startTime}. Join Google Meet: ${finalMeetingLink}`,
          html: recipientHtml,
        });
      }

      // Confirmation email to initiator if email available
      if (req.user?.email && req.user.email !== recipientUser?.email) {
        const initiatorHtml = sessionScheduledEmail({
          recipientName: req.user.name,
          otherPartyName: recipientUser.name,
          skillName,
          teacherName: teacher.name,
          learnerName: learner.name,
          date: formattedDate,
          startTime,
          endTime,
          meetingLink: finalMeetingLink,
          notes: session.notes,
          clientUrl,
        });

        await sendEmail({
          email: req.user.email,
          subject: `Session Scheduled Confirmation: ${skillName} with ${recipientUser.name}`,
          message: `Your learning session for ${skillName} is scheduled for ${formattedDate} at ${startTime}. Google Meet Link: ${finalMeetingLink}`,
          html: initiatorHtml,
        });
      }
    } catch (emailErr) {
      console.error('[Email Error in createSession]', emailErr.message);
    }

    // Send auto chat message to connection so learner & teacher get the Google Meet link in their chat session
    if (connectionId) {
      try {
        const formattedDateStr = new Date(date).toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const chatMessageText = `📹 **Google Meet Learning Session Scheduled**\n\n• **Skill**: ${populatedSession.skill.name}\n• **Date**: ${formattedDateStr}\n• **Time**: ${startTime} - ${endTime}\n• **Google Meet Link**: ${finalMeetingLink}${notes ? `\n• **Agenda**: ${notes}` : ''}`;

        const chatMsg = await Message.create({
          conversation: connectionId,
          sender: req.user.id,
          receiver: otherUserId,
          text: chatMessageText,
        });

        await Connection.findByIdAndUpdate(connectionId, {
          lastActivityAt: new Date(),
        });

        if (io) {
          const populatedMsg = await Message.findById(chatMsg._id)
            .populate('sender', 'name username profileImage')
            .populate('receiver', 'name username profileImage');

          io.to(`conv_${connectionId}`).emit('new_message', populatedMsg);
          io.to(`user_${otherUserId}`).emit('message_notification', {
            conversationId: connectionId,
            message: populatedMsg,
          });
        }
      } catch (chatErr) {
        console.error('[Chat Message Error in createSession]', chatErr.message);
      }
    }

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
      .populate('teacher', 'name username email')
      .populate('learner', 'name username email')
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

    if (session.status === 'Confirmed') {
      return res.status(200).json({
        success: true,
        message: 'Session is already confirmed',
        data: session,
      });
    }

    if (session.status !== 'Pending') {
      return next(new ErrorResponse(`Cannot accept session with status "${session.status}"`, 400));
    }

    session.status = 'Confirmed';
    await session.save();

    const otherUser =
      session.teacher._id.toString() === req.user.id
        ? session.learner
        : session.teacher;

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUser._id,
      sender: req.user.id,
      type: 'session_confirmed',
      title: 'Session Confirmed!',
      message: `${req.user.name} confirmed the upcoming ${session.skill.name} session.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    // Send confirmation email with Google Meet link to both participants
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const sendConfirm = async (recipient, otherParty) => {
        if (!recipient?.email) return;
        const html = sessionConfirmedEmail({
          recipientName: recipient.name,
          otherPartyName: otherParty.name,
          skillName: session.skill.name,
          date: formattedDate,
          startTime: session.startTime,
          endTime: session.endTime,
          meetingLink: session.meetingLink,
          clientUrl,
        });

        await sendEmail({
          email: recipient.email,
          subject: `Confirmed: ${session.skill.name} Learning Session (Google Meet Link)`,
          message: `Your session for ${session.skill.name} with ${otherParty.name} on ${formattedDate} at ${session.startTime} is confirmed. Join Google Meet: ${session.meetingLink}`,
          html,
        });
      };

      await Promise.all([
        sendConfirm(session.teacher, session.learner),
        sendConfirm(session.learner, session.teacher),
      ]);
    } catch (emailErr) {
      console.error('[Email Error in acceptSession]', emailErr.message);
    }

    // Send auto chat message to connection confirming session with Google Meet link
    if (session.connection) {
      try {
        const chatMessageText = `✅ **Session Confirmed!**\n\n• **Skill**: ${session.skill.name}\n• **Google Meet Link**: ${session.meetingLink}`;

        const chatMsg = await Message.create({
          conversation: session.connection,
          sender: req.user.id,
          receiver: otherUser._id,
          text: chatMessageText,
        });

        await Connection.findByIdAndUpdate(session.connection, {
          lastActivityAt: new Date(),
        });

        if (io) {
          const populatedMsg = await Message.findById(chatMsg._id)
            .populate('sender', 'name username profileImage')
            .populate('receiver', 'name username profileImage');

          io.to(`conv_${session.connection}`).emit('new_message', populatedMsg);
        }
      } catch (chatErr) {
        console.error('[Chat Message Error in acceptSession]', chatErr.message);
      }
    }

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

    // Time-Banking: Teacher earns 1 credit, completedSessions & learnersHelped
    await User.findByIdAndUpdate(session.teacher, {
      $inc: { timeCredits: 1, completedSessions: 1, learnersHelped: 1 },
    });

    // Time-Banking: Learner consumes 1 credit & increment skill progress
    const learner = await User.findById(session.learner);
    if (learner) {
      if (learner.timeCredits > 0) {
        learner.timeCredits = Math.max(0, learner.timeCredits - 1);
      }
      const skillItem = learner.skillsToLearn.find(
        (item) => item.skill.toString() === session.skill.toString()
      );

      if (skillItem) {
        skillItem.sessionsCompleted = (skillItem.sessionsCompleted || 0) + 1;
        skillItem.progress = Math.min(100, (skillItem.progress || 0) + 15);
        skillItem.lastLearned = new Date();
      }
      await learner.save();
    }

    const io = req.app.get('io');
    const otherUserId =
      session.teacher.toString() === req.user.id ? session.learner : session.teacher;

    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_completed',
      title: 'Session Completed!',
      message: `The session has been marked completed. Teacher earned 1 time credit. You can now leave a review!`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session completed successfully. Time credits and progress updated.',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule a session
// @route   PUT /api/sessions/:id/reschedule
// @access  Private
exports.rescheduleSession = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher.toString() === req.user.id ||
      session.learner.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to reschedule this session', 403));
    }

    if (session.status === 'Completed' || session.status === 'Cancelled') {
      return next(new ErrorResponse(`Cannot reschedule a session with status "${session.status}"`, 400));
    }

    if (date) session.date = new Date(date);
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    session.status = 'Rescheduled';
    await session.save();

    const otherUserId =
      session.teacher.toString() === req.user.id ? session.learner : session.teacher;

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_scheduled',
      title: 'Session Rescheduled',
      message: `${req.user.name} rescheduled the session to ${new Date(date || session.date).toLocaleDateString()} at ${startTime || session.startTime}.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session rescheduled successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
