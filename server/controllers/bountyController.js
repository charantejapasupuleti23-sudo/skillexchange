const BountyQuestion = require('../models/BountyQuestion');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { recordCreditTransaction } = require('../utils/gamification');
const { createNotification } = require('../utils/notify');

// @desc    Get all bounty questions
// @route   GET /api/bounties
// @access  Public
exports.getBounties = async (req, res, next) => {
  try {
    const { skill, status } = req.query;
    const query = {};

    if (skill && skill !== 'All') {
      query.skill = { $regex: skill, $options: 'i' };
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const bounties = await BountyQuestion.find(query)
      .populate('author', 'name username profileImage rating')
      .populate('answers.author', 'name username profileImage rating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bounties.length,
      data: bounties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new bounty question with 1 credit bounty
// @route   POST /api/bounties
// @access  Private
exports.createBounty = async (req, res, next) => {
  try {
    const { title, description, skill, codeSnippet, tags, bounty = 1 } = req.body;

    if (!title || !description) {
      return next(new ErrorResponse('Please provide question title and description', 400));
    }

    const user = await User.findById(req.user.id);
    if ((user.timeCredits || 0) < bounty) {
      return next(new ErrorResponse(`Insufficient Time Credits for bounty (Bounty: ${bounty} credit)`, 400));
    }

    // Deduct credit for bounty
    await recordCreditTransaction({
      userId: req.user.id,
      type: 'bounty_posted',
      amount: bounty,
      description: `Posted Q&A Bounty: ${title}`,
    });

    const newBounty = await BountyQuestion.create({
      author: req.user.id,
      title: title.trim(),
      description: description.trim(),
      skill: skill || 'General',
      codeSnippet: codeSnippet?.code ? codeSnippet : undefined,
      tags: Array.isArray(tags) ? tags : [],
      bounty: Number(bounty),
      status: 'open',
    });

    const populated = await BountyQuestion.findById(newBounty._id)
      .populate('author', 'name username profileImage rating');

    res.status(201).json({
      success: true,
      message: 'Bounty question published to public community feed!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answer to a bounty question
// @route   POST /api/bounties/:id/answers
// @access  Private
exports.submitAnswer = async (req, res, next) => {
  try {
    const { text, codeSnippet } = req.body;
    if (!text || !text.trim()) {
      return next(new ErrorResponse('Please provide answer text', 400));
    }

    const bounty = await BountyQuestion.findById(req.params.id);
    if (!bounty) {
      return next(new ErrorResponse('Bounty question not found', 404));
    }

    const newAnswer = {
      author: req.user.id,
      text: text.trim(),
      codeSnippet: codeSnippet?.code ? codeSnippet : undefined,
      accepted: false,
      upvotes: [],
      createdAt: new Date(),
    };

    bounty.answers.push(newAnswer);
    await bounty.save();

    // Notify question author
    if (bounty.author.toString() !== req.user.id) {
      const io = req.app.get('io');
      if (io) {
        await createNotification(io, {
          recipient: bounty.author,
          sender: req.user.id,
          type: 'bounty_answer_received',
          title: 'New Answer on Your Bounty Question! 💡',
          message: `${req.user.name} posted an answer to "${bounty.title}". Review it and award the bounty credit!`,
          referenceId: bounty._id,
          referenceType: 'BountyQuestion',
        });
      }
    }

    const populated = await BountyQuestion.findById(bounty._id)
      .populate('author', 'name username profileImage rating')
      .populate('answers.author', 'name username profileImage rating');

    res.status(201).json({
      success: true,
      message: 'Answer submitted!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept answer and transfer bounty credit
// @route   PUT /api/bounties/:id/answers/:answerId/accept
// @access  Private (Author only)
exports.acceptAnswer = async (req, res, next) => {
  try {
    const bounty = await BountyQuestion.findById(req.params.id);
    if (!bounty) {
      return next(new ErrorResponse('Bounty question not found', 404));
    }

    if (bounty.author.toString() !== req.user.id) {
      return next(new ErrorResponse('Only the question author can accept answers and award bounties', 403));
    }

    if (bounty.status === 'resolved') {
      return next(new ErrorResponse('This bounty has already been resolved and awarded', 400));
    }

    const answer = bounty.answers.id(req.params.answerId);
    if (!answer) {
      return next(new ErrorResponse('Answer not found', 404));
    }

    answer.accepted = true;
    bounty.acceptedAnswer = answer._id;
    bounty.status = 'resolved';
    await bounty.save();

    // Award bounty credits to the answer author
    await recordCreditTransaction({
      userId: answer.author,
      type: 'bounty_earned',
      amount: bounty.bounty || 1,
      description: `Awarded bounty credit for accepted answer on: "${bounty.title}"`,
      peerId: req.user.id,
    });

    // Send notification to answer author
    const io = req.app.get('io');
    if (io) {
      await createNotification(io, {
        recipient: answer.author,
        sender: req.user.id,
        type: 'bounty_accepted',
        title: 'Bounty Awarded! 💰',
        message: `${req.user.name} accepted your answer on "${bounty.title}"! You earned ${bounty.bounty} Time Credit.`,
        referenceId: bounty._id,
        referenceType: 'BountyQuestion',
      });
    }

    const populated = await BountyQuestion.findById(bounty._id)
      .populate('author', 'name username profileImage rating')
      .populate('answers.author', 'name username profileImage rating');

    res.status(200).json({
      success: true,
      message: 'Answer accepted and bounty credit awarded!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};
