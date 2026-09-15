const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('../utils/notify');

// @desc    Create a review for a completed session
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { sessionId, rating, comment } = req.body;

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
    });

    // Mark session as reviewed
    session.isReviewed = true;
    await session.save();

    // Notify teacher
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: session.teacher,
      sender: req.user.id,
      type: 'new_review',
      title: 'New Review Received!',
      message: `${req.user.name} left a ${rating}-star review for your ${session.skill.name} session: "${comment.length > 50 ? comment.substring(0, 47) + '...' : comment}"`,
      referenceId: review._id,
      referenceType: 'Review',
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name username profileImage')
      .populate('skill', 'name category');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
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
