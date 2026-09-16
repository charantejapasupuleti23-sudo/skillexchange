const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');
const { evaluateUserBadges } = require('../utils/gamification');

// @desc    Create a review & skill endorsement for a completed session
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { sessionId, rating, comment, endorseSkill = true, tags = [] } = req.body;

    if (!sessionId || !rating || !comment) {
      return next(new ErrorResponse('Please provide sessionId, rating (1-5), and comment', 400));
    }

    const session = await Session.findById(sessionId).populate('skill', 'name');
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    // Verify session status is Completed
    if (session.status !== 'Completed') {
      return next(new ErrorResponse('You can only review a session that has been marked Completed', 400));
    }

    // Reviewer must be the learner or teacher (primarily learner reviewing teacher)
    if (session.learner.toString() !== req.user.id) {
      return next(new ErrorResponse('Only the learner can submit a teacher review for this session', 403));
    }

    // Cannot review oneself
    if (session.teacher.toString() === req.user.id) {
      return next(new ErrorResponse('You cannot review yourself', 400));
    }

    // Check if session has already been reviewed
    const existingReview = await Review.findOne({ session: sessionId });
    if (existingReview) {
      return next(new ErrorResponse('A review has already been submitted for this session', 400));
    }

    const review = await Review.create({
      session: sessionId,
      reviewer: req.user.id,
      reviewedUser: session.teacher,
      skill: session.skill._id,
      rating: Number(rating),
      comment: comment.trim(),
      endorsedSkill: !!endorseSkill,
      tags: Array.isArray(tags) ? tags : [],
    });

    // Mark session as reviewed
    session.isReviewed = true;
    if (endorseSkill) {
      session.endorsedSkill = session.skill._id;
    }
    await session.save();

    // If endorsed, add endorsement entry directly to mentor's taught skills
    if (endorseSkill) {
      const mentor = await User.findById(session.teacher);
      if (mentor) {
        const taughtSkill = mentor.skillsToTeach.find(
          (item) => item.skill.toString() === session.skill._id.toString()
        );
        if (taughtSkill) {
          taughtSkill.endorsements = taughtSkill.endorsements || [];
          taughtSkill.endorsements.push({
            user: req.user.id,
            comment: comment.trim().substring(0, 200),
            createdAt: new Date(),
          });
          taughtSkill.endorsementsCount = (taughtSkill.endorsementsCount || 0) + 1;
          await mentor.save();
        }
      }
    }

    // Check and award any earned badges
    await Promise.all([
      evaluateUserBadges(session.teacher),
      evaluateUserBadges(req.user.id),
    ]);

    // Notify teacher
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: session.teacher,
      sender: req.user.id,
      type: 'new_review',
      title: 'New Review & Skill Endorsement Received!',
      message: `${req.user.name} left a ${rating}-star review and verified your ${session.skill.name} skill: "${comment.length > 50 ? comment.substring(0, 47) + '...' : comment}"`,
      referenceId: review._id,
      referenceType: 'Review',
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name username profileImage')
      .populate('skill', 'name category');

    res.status(201).json({
      success: true,
      message: 'Review and skill endorsement submitted successfully',
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a specific user
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewedUser: userId })
      .populate('reviewer', 'name username profileImage rating')
      .populate('skill', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
