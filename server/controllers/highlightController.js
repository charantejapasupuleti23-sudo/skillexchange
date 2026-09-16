const Highlight = require('../models/Highlight');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all community learning highlights
// @route   GET /api/highlights
// @access  Public
exports.getHighlights = async (req, res, next) => {
  try {
    const highlights = await Highlight.find()
      .populate('author', 'name username profileImage rating occupation')
      .populate('mentor', 'name username profileImage rating occupation')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: highlights.length,
      data: highlights,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish a new "What I Learned Today" highlight
// @route   POST /api/highlights
// @access  Private
exports.createHighlight = async (req, res, next) => {
  try {
    const { takeaway, mentorId, skill } = req.body;

    if (!takeaway || !takeaway.trim()) {
      return next(new ErrorResponse('Please provide your learning takeaway', 400));
    }

    const highlight = await Highlight.create({
      author: req.user.id,
      mentor: mentorId || undefined,
      skill: skill || 'General',
      takeaway: takeaway.trim(),
      likes: [],
    });

    const populated = await Highlight.findById(highlight._id)
      .populate('author', 'name username profileImage rating occupation')
      .populate('mentor', 'name username profileImage rating occupation');

    const io = req.app.get('io');
    if (io) {
      io.emit('new_highlight_posted', populated);
    }

    res.status(201).json({
      success: true,
      message: 'Highlight published to community feed!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / React to a highlight
// @route   POST /api/highlights/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) {
      return next(new ErrorResponse('Highlight not found', 404));
    }

    const userIdx = highlight.likes.findIndex((u) => u.toString() === req.user.id);
    if (userIdx > -1) {
      highlight.likes.splice(userIdx, 1);
    } else {
      highlight.likes.push(req.user.id);
    }

    await highlight.save();

    const populated = await Highlight.findById(highlight._id)
      .populate('author', 'name username profileImage rating occupation')
      .populate('mentor', 'name username profileImage rating occupation');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};
