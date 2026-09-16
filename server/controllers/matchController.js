const User = require('../models/User');
const { calculateMatchScore, findMatchesForUser } = require('../services/matchingService');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get top recommended matches and 3-way barter loops for logged-in user
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const minScore = req.query.minScore ? parseInt(req.query.minScore, 10) : 25;
    const day = req.query.day || '';
    const category = req.query.category || '';
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;
    const matchTypeFilter = req.query.type || 'all';

    const result = await findMatchesForUser(req.user.id, {
      limit,
      minScore,
      day,
      category,
      minRating,
      matchTypeFilter,
    });

    res.status(200).json({
      success: true,
      count: result.matches.length,
      data: result.matches,
      threeWayLoops: result.threeWayLoops,
      stats: result.stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match compatibility details with a specific user
// @route   GET /api/matches/:userId
// @access  Private
exports.getMatchWithUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return next(new ErrorResponse('Cannot calculate match score with yourself', 400));
    }

    const currentUser = await User.findById(req.user.id)
      .populate('skillsToTeach.skill', 'name category icon')
      .populate('skillsToLearn.skill', 'name category icon');

    const targetUser = await User.findById(userId)
      .select('-password')
      .populate('skillsToTeach.skill', 'name category icon')
      .populate('skillsToLearn.skill', 'name category icon');

    if (!targetUser) {
      return next(new ErrorResponse('Target user not found', 404));
    }

    const matchResult = calculateMatchScore(currentUser, targetUser);

    res.status(200).json({
      success: true,
      data: {
        user: targetUser,
        matchScore: matchResult.score,
        matchedSkills: matchResult.matchedSkills,
        skillsTheyTeachYou: matchResult.skillsTheyTeachYou,
        skillsYouTeachThem: matchResult.skillsYouTeachThem,
        reasons: matchResult.reasons,
        breakdown: matchResult.breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
