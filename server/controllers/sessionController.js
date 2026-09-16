const Session = require('../models/Session');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Availability = require('../models/Availability');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');
const { generateGoogleMeetLink } = require('../utils/meetingLink');
const sendEmail = require('../utils/sendEmail');
const { sessionScheduledEmail, sessionConfirmedEmail } = require('../utils/emailTemplates');
const { evaluateUserBadges, recordCreditTransaction } = require('../utils/gamification');

// @desc    Schedule a new learning session (with escrow hold)
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
      availabilitySlotId,
    } = req.body;

    if (!teacherId || !learnerId || !skillId || !date || !startTime || !endTime) {
      return next(new ErrorResponse('Please provide all required session details', 400));
    }

    // Verify authorization: User must be teacher or learner
    if (req.user.id !== teacherId && req.user.id !== learnerId) {
      return next(new ErrorResponse('You are not authorized to schedule this session', 403));
    }

    // Check learner credit balance for escrow hold (1 credit)
    const learner = await User.findById(learnerId);
    if (!learner) {
      return next(new ErrorResponse('Learner user not found', 404));
    }

    if ((learner.timeCredits || 0) < 1) {
      return next(
        new ErrorResponse(
          'Learner does not have enough Time Credits (1 credit required to book a session). Teach a session or earn credits first!',
          400
        )
      );
    }

    // Prevent scheduling in the past
    const sessionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      return next(new ErrorResponse('Cannot schedule a session for a date in the past', 400));
    }

    // Auto-generate a valid Google Meet link if not provided
    const finalMeetingLink =
      meetingLink && meetingLink.trim().length > 0
        ? meetingLink.trim()
        : generateGoogleMeetLink();

    // Create session record with escrow hold status
    const session = await Session.create({
      connection: connectionId || undefined,
      teacher: teacherId,
      learner: learnerId,
      skill: skillId,
      date: sessionDate,
      startTime,
      endTime,
      meetingLink: finalMeetingLink,
      notes: notes || '',
      status: 'Pending',
      creditCost: 1,
      escrowStatus: 'held',
      availabilitySlot: availabilitySlotId || undefined,
    });

    // Hold 1 credit in escrow from learner
    await recordCreditTransaction({
      userId: learnerId,
      type: 'session_hold',
      amount: 1,
      description: `Escrow hold for session booking (${startTime} - ${endTime})`,
      sessionId: session._id,
      peerId: teacherId,
    });

    // If booked from an availability slot, mark the slot as booked
    if (availabilitySlotId) {
      await Availability.findByIdAndUpdate(availabilitySlotId, {
        isBooked: true,
        bookedBy: learnerId,
        bookedSession: session._id,
      });
    }

    const populatedSession = await Session.findById(session._id)
      .populate('teacher', 'name username email profileImage rating')
      .populate('learner', 'name username email profileImage rating')
      .populate('skill', 'name category icon');

    // Notify the other party
    const otherUserId = req.user.id === teacherId ? learnerId : teacherId;
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_scheduled',
      title: 'New Session Scheduled (1 Credit in Escrow)',
      message: `${req.user.name} scheduled a learning session for ${populatedSession.skill.name} on ${new Date(date).toLocaleDateString()} at ${startTime}.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    // Send email invitations with Google Meet link
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const formattedDate = new Date(date).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const teacher = populatedSession.teacher;
      const learnerObj = populatedSession.learner;
      const skillName = populatedSession.skill.name;

      const recipientUser = req.user.id === teacher._id.toString() ? learnerObj : teacher;
      if (recipientUser?.email) {
        const recipientHtml = sessionScheduledEmail({
          recipientName: recipientUser.name,
          otherPartyName: req.user.name,
          skillName,
          teacherName: teacher.name,
          learnerName: learnerObj.name,
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
    } catch (emailErr) {
      console.error('[Email Error in createSession]', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Learning session scheduled with 1 Time Credit secured in escrow.',
      data: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions for current user
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
      .populate('teacher', 'name username profileImage rating email bio')
      .populate('learner', 'name username profileImage rating email bio')
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
      .populate('teacher', 'name username profileImage rating bio occupation email')
      .populate('learner', 'name username profileImage rating bio occupation email')
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

    // Send confirmation email
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

    res.status(200).json({
      success: true,
      message: 'Session confirmed successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a scheduled session (refund escrow)
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
    if (session.escrowStatus === 'held') {
      session.escrowStatus = 'refunded';
      // Refund escrow to learner
      await recordCreditTransaction({
        userId: session.learner,
        type: 'session_refund',
        amount: 1,
        description: 'Escrow refunded: session proposal declined',
        sessionId: session._id,
        peerId: session.teacher,
      });
    }

    // Release availability slot if attached
    if (session.availabilitySlot) {
      await Availability.findByIdAndUpdate(session.availabilitySlot, {
        isBooked: false,
        bookedBy: null,
        bookedSession: null,
      });
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session proposal declined. Time credit refunded.',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a session (refund escrow)
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

    if (!['Pending', 'Confirmed', 'Rescheduled'].includes(session.status)) {
      return next(new ErrorResponse(`Cannot cancel a session that is already "${session.status}"`, 400));
    }

    session.status = 'Cancelled';
    if (session.escrowStatus === 'held') {
      session.escrowStatus = 'refunded';
      // Refund escrow to learner
      await recordCreditTransaction({
        userId: session.learner,
        type: 'session_refund',
        amount: 1,
        description: 'Escrow refunded: session cancelled',
        sessionId: session._id,
        peerId: session.teacher,
      });
    }

    // Release availability slot if attached
    if (session.availabilitySlot) {
      await Availability.findByIdAndUpdate(session.availabilitySlot, {
        isBooked: false,
        bookedBy: null,
        bookedSession: null,
      });
    }

    await session.save();

    const otherUserId =
      session.teacher.toString() === req.user.id ? session.learner : session.teacher;

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `${req.user.name} cancelled the scheduled session. Time credit has been refunded.`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session cancelled and escrow credit refunded',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Two-Way Mutual Session Check-in / Completion & Credit Release
// @route   PUT /api/sessions/:id/complete
// @access  Private
exports.completeSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isTeacher = session.teacher.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isTeacher && !isLearner) {
      return next(new ErrorResponse('Not authorized to check in for this session', 403));
    }

    if (session.status === 'Completed') {
      return next(new ErrorResponse('Session is already completed', 400));
    }

    if (!['Confirmed', 'Rescheduled'].includes(session.status)) {
      return next(new ErrorResponse(`Cannot complete a session with status "${session.status}"`, 400));
    }

    // Mark check-in for current user
    if (isTeacher) {
      session.confirmedByTeacher = true;
      session.teacherCheckedInAt = new Date();
    }
    if (isLearner) {
      session.confirmedByLearner = true;
      session.learnerCheckedInAt = new Date();
    }

    // Complete session and release credits if either confirmed (or two-way confirmed)
    session.status = 'Completed';
    session.progressUpdated = true;
    session.escrowStatus = 'released';
    await session.save();

    // 1. Release credit: Deposit +1 credit into teacher's wallet
    await recordCreditTransaction({
      userId: session.teacher,
      type: 'session_earned',
      amount: 1,
      description: 'Earned 1 Time Credit for teaching a session',
      sessionId: session._id,
      peerId: session.learner,
    });

    // 2. Clear learner escrow
    const learner = await User.findById(session.learner);
    if (learner) {
      learner.escrowCredits = Math.max(0, (learner.escrowCredits || 0) - 1);

      // Increment learner skill progress
      const skillItem = learner.skillsToLearn.find(
        (item) => item.skill.toString() === session.skill.toString()
      );
      if (skillItem) {
        skillItem.sessionsCompleted = (skillItem.sessionsCompleted || 0) + 1;
        skillItem.progress = Math.min(100, (skillItem.progress || 0) + 15);
        skillItem.lastLearned = new Date();
      }

      // Update streaks
      learner.streak = learner.streak || { current: 1, longest: 1, lastActiveDate: new Date() };
      learner.streak.current = (learner.streak.current || 0) + 1;
      learner.streak.longest = Math.max(learner.streak.longest || 1, learner.streak.current);
      learner.streak.lastActiveDate = new Date();

      await learner.save();
    }

    // 3. Update teacher stats & streak
    const teacher = await User.findById(session.teacher);
    if (teacher) {
      teacher.completedSessions = (teacher.completedSessions || 0) + 1;
      teacher.learnersHelped = (teacher.learnersHelped || 0) + 1;
      teacher.streak = teacher.streak || { current: 1, longest: 1, lastActiveDate: new Date() };
      teacher.streak.current = (teacher.streak.current || 0) + 1;
      teacher.streak.longest = Math.max(teacher.streak.longest || 1, teacher.streak.current);
      teacher.streak.lastActiveDate = new Date();
      await teacher.save();
    }

    // 4. Evaluate badges for both users
    await Promise.all([
      evaluateUserBadges(session.teacher),
      evaluateUserBadges(session.learner),
    ]);

    const io = req.app.get('io');
    const otherUserId = isTeacher ? session.learner : session.teacher;

    await createNotification(io, {
      recipient: otherUserId,
      sender: req.user.id,
      type: 'session_completed',
      title: 'Session Completed & Verified! 🎉',
      message: `The session has been marked completed. Teacher earned 1 Time Credit. Please leave a review and skill endorsement!`,
      referenceId: session._id,
      referenceType: 'Session',
    });

    res.status(200).json({
      success: true,
      message: 'Session verified & completed! 1 Time Credit released to mentor.',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Collaborative Workspace Scratchpad & Code Editor
// @route   PUT /api/sessions/:id/workspace
// @access  Private
exports.updateWorkspace = async (req, res, next) => {
  try {
    const { workspaceNotes, workspaceCode, workspaceLanguage } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const isAuthorized =
      session.teacher.toString() === req.user.id ||
      session.learner.toString() === req.user.id;

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to edit this session workspace', 403));
    }

    if (workspaceNotes !== undefined) session.workspaceNotes = workspaceNotes;
    if (workspaceCode !== undefined) session.workspaceCode = workspaceCode;
    if (workspaceLanguage !== undefined) session.workspaceLanguage = workspaceLanguage;

    await session.save();

    // Broadcast live workspace update via Socket.io
    const io = req.app.get('io');
    if (io) {
      const otherUserId =
        session.teacher.toString() === req.user.id ? session.learner : session.teacher;
      io.to(`user_${otherUserId}`).emit('workspace_updated', {
        sessionId: session._id,
        workspaceNotes: session.workspaceNotes,
        workspaceCode: session.workspaceCode,
        workspaceLanguage: session.workspaceLanguage,
        updatedBy: req.user.name,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workspace saved successfully',
      data: {
        workspaceNotes: session.workspaceNotes,
        workspaceCode: session.workspaceCode,
        workspaceLanguage: session.workspaceLanguage,
      },
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
