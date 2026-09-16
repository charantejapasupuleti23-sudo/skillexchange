const Workshop = require('../models/Workshop');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { generateGoogleMeetLink } = require('../utils/meetingLink');
const { createNotification } = require('../utils/notify');
const { recordCreditTransaction } = require('../utils/gamification');

// @desc    Get all workshops
// @route   GET /api/workshops
// @access  Public
exports.getWorkshops = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    } else {
      query.status = { $in: ['upcoming', 'live'] };
    }

    const workshops = await Workshop.find(query)
      .populate('host', 'name username profileImage rating occupation')
      .populate('skill', 'name category icon')
      .populate('attendees.user', 'name username profileImage')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: workshops.length,
      data: workshops,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single workshop by ID
// @route   GET /api/workshops/:id
// @access  Public
exports.getWorkshopById = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('host', 'name username profileImage rating occupation bio')
      .populate('skill', 'name category icon')
      .populate('attendees.user', 'name username profileImage rating');

    if (!workshop) {
      return next(new ErrorResponse('Workshop not found', 404));
    }

    res.status(200).json({
      success: true,
      data: workshop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Host/Create a new workshop
// @route   POST /api/workshops
// @access  Private
exports.createWorkshop = async (req, res, next) => {
  try {
    const {
      title,
      description,
      skillId,
      category,
      date,
      startTime,
      endTime,
      meetingLink,
      capacity,
      creditCost,
      tags,
    } = req.body;

    if (!title || !description || !skillId || !date || !startTime || !endTime) {
      return next(new ErrorResponse('Please provide all required workshop fields', 400));
    }

    const workshop = await Workshop.create({
      host: req.user.id,
      title: title.trim(),
      description: description.trim(),
      skill: skillId,
      category: category || 'Technical',
      date: new Date(date),
      startTime,
      endTime,
      meetingLink: meetingLink?.trim() || generateGoogleMeetLink(),
      capacity: capacity ? Number(capacity) : 15,
      creditCost: creditCost !== undefined ? Number(creditCost) : 1,
      tags: Array.isArray(tags) ? tags : [],
      status: 'upcoming',
    });

    const populated = await Workshop.findById(workshop._id)
      .populate('host', 'name username profileImage rating')
      .populate('skill', 'name category icon');

    res.status(201).json({
      success: true,
      message: 'Group workshop published successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    RSVP / Join a workshop
// @route   POST /api/workshops/:id/join
// @access  Private
exports.joinWorkshop = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return next(new ErrorResponse('Workshop not found', 404));
    }

    if (workshop.host.toString() === req.user.id) {
      return next(new ErrorResponse('You are the host of this workshop', 400));
    }

    const isAlreadyAttending = workshop.attendees.some(
      (a) => a.user.toString() === req.user.id
    );

    if (isAlreadyAttending) {
      return next(new ErrorResponse('You are already registered for this workshop', 400));
    }

    if (workshop.attendees.length >= workshop.capacity) {
      return next(new ErrorResponse('This workshop has reached maximum capacity', 400));
    }

    // Check credits if workshop has a cost
    if (workshop.creditCost > 0) {
      const user = await User.findById(req.user.id);
      if ((user.timeCredits || 0) < workshop.creditCost) {
        return next(new ErrorResponse(`Insufficient Time Credits (Cost: ${workshop.creditCost} credits)`, 400));
      }

      await recordCreditTransaction({
        userId: req.user.id,
        type: 'workshop_fee',
        amount: workshop.creditCost,
        description: `RSVP for group workshop: ${workshop.title}`,
        peerId: workshop.host,
      });

      // Award host credits
      await recordCreditTransaction({
        userId: workshop.host,
        type: 'workshop_earned',
        amount: workshop.creditCost,
        description: `Earned credits from workshop RSVP: ${workshop.title}`,
        peerId: req.user.id,
      });
    }

    workshop.attendees.push({
      user: req.user.id,
      joinedAt: new Date(),
    });

    await workshop.save();

    // Notify host
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: workshop.host,
      sender: req.user.id,
      type: 'session_scheduled',
      title: 'New Workshop Attendee! 👥',
      message: `${req.user.name} joined your workshop "${workshop.title}".`,
      referenceId: workshop._id,
      referenceType: 'Workshop',
    });

    res.status(200).json({
      success: true,
      message: 'Successfully registered for workshop!',
      data: workshop,
    });
  } catch (error) {
    next(error);
  }
};
