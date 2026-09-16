const Channel = require('../models/Channel');
const ErrorResponse = require('../utils/errorResponse');

const DEFAULT_CHANNELS = [
  {
    slug: 'react-frontend',
    name: 'react-frontend',
    description: 'React, Next.js, state management, hooks & frontend architecture',
    icon: 'Atom',
    category: 'Frontend',
  },
  {
    slug: 'system-design',
    name: 'system-design',
    description: 'Microservices, distributed systems, caching, scaling & high availability',
    icon: 'Network',
    category: 'Architecture',
  },
  {
    slug: 'dsa-prep',
    name: 'dsa-prep',
    description: 'Data Structures, algorithms, LeetCode problem solving & mock interview prep',
    icon: 'Code2',
    category: 'Interviews',
  },
  {
    slug: 'python-ai',
    name: 'python-ai',
    description: 'Python, Machine Learning, Fast API, LLMs & data engineering',
    icon: 'Sparkles',
    category: 'AI & Data',
  },
  {
    slug: 'c-plus-plus',
    name: 'c-plus-plus',
    description: 'Pointers, memory management, STL, competitive programming & low-level design',
    icon: 'Terminal',
    category: 'Systems',
  },
  {
    slug: 'ui-ux-design',
    name: 'ui-ux-design',
    description: 'Figma mockups, design systems, usability teardowns & feedback',
    icon: 'Palette',
    category: 'Design',
  },
];

// Seed default channels if empty
const ensureDefaultChannels = async () => {
  const count = await Channel.countDocuments();
  if (count === 0) {
    await Channel.insertMany(DEFAULT_CHANNELS);
  }
};

// @desc    Get all channels
// @route   GET /api/channels
// @access  Public
exports.getChannels = async (req, res, next) => {
  try {
    await ensureDefaultChannels();
    const channels = await Channel.find().select('-messages').sort({ category: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: channels.length,
      data: channels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single channel with messages
// @route   GET /api/channels/:slug
// @access  Public
exports.getChannelBySlug = async (req, res, next) => {
  try {
    await ensureDefaultChannels();
    let channel = await Channel.findOne({ slug: req.params.slug.toLowerCase() })
      .populate('messages.sender', 'name username profileImage rating');

    if (!channel) {
      // Find fallback or create
      const defaultMatch = DEFAULT_CHANNELS.find((d) => d.slug === req.params.slug.toLowerCase());
      if (defaultMatch) {
        channel = await Channel.create(defaultMatch);
      } else {
        return next(new ErrorResponse('Channel not found', 404));
      }
    }

    res.status(200).json({
      success: true,
      data: channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post message to channel
// @route   POST /api/channels/:slug/messages
// @access  Private
exports.postMessage = async (req, res, next) => {
  try {
    const { text, codeSnippet } = req.body;
    if (!text || !text.trim()) {
      return next(new ErrorResponse('Please provide message text', 400));
    }

    let channel = await Channel.findOne({ slug: req.params.slug.toLowerCase() });
    if (!channel) {
      return next(new ErrorResponse('Channel not found', 404));
    }

    const newMessage = {
      sender: req.user.id,
      text: text.trim(),
      codeSnippet: codeSnippet?.code ? codeSnippet : undefined,
      upvotes: [],
      createdAt: new Date(),
    };

    channel.messages.push(newMessage);
    await channel.save();

    const populated = await Channel.findById(channel._id)
      .populate('messages.sender', 'name username profileImage rating');

    const addedMsg = populated.messages[populated.messages.length - 1];

    const io = req.app.get('io');
    if (io) {
      io.emit(`channel_${channel.slug}_new_message`, addedMsg);
    }

    res.status(201).json({
      success: true,
      data: addedMsg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote message in channel
// @route   POST /api/channels/:slug/messages/:messageId/upvote
// @access  Private
exports.upvoteMessage = async (req, res, next) => {
  try {
    const channel = await Channel.findOne({ slug: req.params.slug.toLowerCase() });
    if (!channel) {
      return next(new ErrorResponse('Channel not found', 404));
    }

    const msg = channel.messages.id(req.params.messageId);
    if (!msg) {
      return next(new ErrorResponse('Message not found', 404));
    }

    const userIdx = msg.upvotes.findIndex((u) => u.toString() === req.user.id);
    if (userIdx > -1) {
      msg.upvotes.splice(userIdx, 1);
    } else {
      msg.upvotes.push(req.user.id);
    }

    await channel.save();

    const populated = await Channel.findById(channel._id)
      .populate('messages.sender', 'name username profileImage rating');

    const updatedMsg = populated.messages.id(req.params.messageId);

    const io = req.app.get('io');
    if (io) {
      io.emit(`channel_${channel.slug}_message_updated`, updatedMsg);
    }

    res.status(200).json({
      success: true,
      data: updatedMsg,
    });
  } catch (error) {
    next(error);
  }
};
