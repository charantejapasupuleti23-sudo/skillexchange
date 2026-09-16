const Availability = require('../models/Availability');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get published availability slots for a specific mentor
// @route   GET /api/availability/mentor/:userId
// @access  Public
exports.getMentorAvailability = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const slots = await Availability.find({
      mentor: userId,
      isBooked: false,
    })
      .populate('skillFocus', 'name category icon')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's availability slots
// @route   GET /api/availability/my
// @access  Private
exports.getMyAvailability = async (req, res, next) => {
  try {
    const slots = await Availability.find({ mentor: req.user.id })
      .populate('skillFocus', 'name category icon')
      .populate('bookedBy', 'name username profileImage')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / publish an availability slot
// @route   POST /api/availability
// @access  Private
exports.createAvailabilitySlot = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime, skillFocus, notes, durationMinutes } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return next(new ErrorResponse('Please specify day of week, start time, and end time', 400));
    }

    const slot = await Availability.create({
      mentor: req.user.id,
      dayOfWeek,
      startTime,
      endTime,
      durationMinutes: durationMinutes || 60,
      skillFocus: skillFocus || undefined,
      notes: notes || '',
      isRecurring: true,
      isBooked: false,
    });

    const populated = await Availability.findById(slot._id).populate('skillFocus', 'name category icon');

    res.status(201).json({
      success: true,
      message: 'Availability slot published successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an availability slot
// @route   DELETE /api/availability/:id
// @access  Private
exports.deleteAvailabilitySlot = async (req, res, next) => {
  try {
    const slot = await Availability.findById(req.params.id);

    if (!slot) {
      return next(new ErrorResponse('Availability slot not found', 404));
    }

    if (slot.mentor.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this slot', 403));
    }

    await slot.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Availability slot removed',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
