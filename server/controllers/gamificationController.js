const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { ROADMAPS, BADGE_DEFINITIONS, evaluateUserBadges } = require('../utils/gamification');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all predefined roadmaps and current user's progress
// @route   GET /api/gamification/roadmaps
// @access  Private
exports.getRoadmaps = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const userProgressMap = {};

    (user?.roadmapsProgress || []).forEach((rp) => {
      userProgressMap[rp.roadmapId] = {
        completedTopics: rp.completedTopics || [],
        progress: rp.progress || 0,
        lastUpdated: rp.lastUpdated,
      };
    });

    const enrichedRoadmaps = ROADMAPS.map((rm) => {
      const up = userProgressMap[rm.id] || { completedTopics: [], progress: 0 };
      const completedCount = up.completedTopics.length;
      const totalCount = rm.topics.length;
      const calculatedProgress = Math.round((completedCount / totalCount) * 100);

      return {
        ...rm,
        completedTopics: up.completedTopics,
        progress: calculatedProgress,
        totalTopics: totalCount,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedRoadmaps,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle/check off a topic on a learning roadmap
// @route   PUT /api/gamification/roadmaps/:id/topic
// @access  Private
exports.toggleRoadmapTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { topicName } = req.body;

    if (!topicName) {
      return next(new ErrorResponse('Please provide topicName', 400));
    }

    const roadmap = ROADMAPS.find((r) => r.id === id);
    if (!roadmap) {
      return next(new ErrorResponse('Roadmap not found', 404));
    }

    const user = await User.findById(req.user.id);
    user.roadmapsProgress = user.roadmapsProgress || [];

    let progressEntry = user.roadmapsProgress.find((rp) => rp.roadmapId === id);
    if (!progressEntry) {
      progressEntry = {
        roadmapId: id,
        completedTopics: [],
        progress: 0,
        lastUpdated: new Date(),
      };
      user.roadmapsProgress.push(progressEntry);
    }

    const topicIndex = progressEntry.completedTopics.indexOf(topicName);
    if (topicIndex > -1) {
      progressEntry.completedTopics.splice(topicIndex, 1);
    } else {
      progressEntry.completedTopics.push(topicName);
    }

    progressEntry.progress = Math.round(
      (progressEntry.completedTopics.length / roadmap.topics.length) * 100
    );
    progressEntry.lastUpdated = new Date();

    await user.save();
    await evaluateUserBadges(user._id);

    res.status(200).json({
      success: true,
      message: 'Roadmap progress updated',
      data: {
        roadmapId: id,
        completedTopics: progressEntry.completedTopics,
        progress: progressEntry.progress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user time-banking wallet and transaction ledger
// @route   GET /api/gamification/wallet
// @access  Private
exports.getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      'timeCredits escrowCredits completedSessions learnersHelped streak'
    );

    const transactions = await CreditTransaction.find({ user: req.user.id })
      .populate('peer', 'name username profileImage')
      .populate('session', 'date startTime endTime')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: {
        timeCredits: user.timeCredits || 0,
        escrowCredits: user.escrowCredits || 0,
        completedSessions: user.completedSessions || 0,
        learnersHelped: user.learnersHelped || 0,
        streak: user.streak || { current: 1, longest: 1 },
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user badges and milestones
// @route   GET /api/gamification/badges
// @access  Private
exports.getBadges = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const earnedBadges = user.badges || [];
    const earnedIds = earnedBadges.map((b) => b.id);

    const allBadges = BADGE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      icon: def.icon,
      description: def.description,
      isEarned: earnedIds.includes(def.id),
      earnedAt: earnedBadges.find((b) => b.id === def.id)?.earnedAt || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        earnedCount: earnedBadges.length,
        totalCount: allBadges.length,
        badges: allBadges,
        streak: user.streak || { current: 1, longest: 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};
