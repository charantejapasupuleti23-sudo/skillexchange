const User = require('../models/User');
const Skill = require('../models/Skill');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users with filtering, search, and pagination
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res, next) => {
  try {
    const {
      search,
      skill,
      category,
      level,
      rating,
      location,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Don't show current logged in user in discover lists if requested
    if (req.user) {
      query._id = { $ne: req.user.id };
    }

    // General text search
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { username: searchRegex },
        { bio: searchRegex },
        { occupation: searchRegex },
        { location: searchRegex },
      ];
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by minimum rating
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Filter by skill or skill category
    if (skill || category) {
      const skillQuery = {};
      if (skill) {
        skillQuery.name = { $regex: skill, $options: 'i' };
      }
      if (category && category !== 'All') {
        skillQuery.category = category;
      }

      const matchingSkills = await Skill.find(skillQuery).select('_id');
      const skillIds = matchingSkills.map((s) => s._id);

      const teachCondition = {
        skill: { $in: skillIds },
      };
      if (level && level !== 'All') {
        teachCondition.level = level;
      }

      query.skillsToTeach = { $elemMatch: teachCondition };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .populate('skillsToTeach.skill', 'name category icon')
      .populate('skillsToLearn.skill', 'name category icon')
      .sort({ rating: -1, completedSessions: -1, createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('skillsToTeach.skill', 'name category icon description')
      .populate('skillsToLearn.skill', 'name category icon description');

    if (!user) {
      return next(new ErrorResponse(`User not found with id: ${req.params.id}`, 404));
    }

    // Fetch user reviews
    const reviews = await Review.find({ reviewedUser: user._id })
      .populate('reviewer', 'name username profileImage')
      .populate('skill', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update skill to teach
// @route   POST /api/users/skills/teach
// @access  Private
exports.addTeachSkill = async (req, res, next) => {
  try {
    const { skillId, level, yearsOfExperience, description } = req.body;

    if (!skillId) {
      return next(new ErrorResponse('Please select a skill', 400));
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      return next(new ErrorResponse('Skill not found', 404));
    }

    const user = await User.findById(req.user.id);

    // Check if skill already exists in skillsToTeach
    const existingIndex = user.skillsToTeach.findIndex(
      (item) => item.skill.toString() === skillId
    );

    if (existingIndex > -1) {
      // Update existing
      user.skillsToTeach[existingIndex].level = level || user.skillsToTeach[existingIndex].level;
      if (yearsOfExperience !== undefined) {
        user.skillsToTeach[existingIndex].yearsOfExperience = yearsOfExperience;
      }
      if (description !== undefined) {
        user.skillsToTeach[existingIndex].description = description;
      }
    } else {
      // Add new
      user.skillsToTeach.push({
        skill: skillId,
        level: level || 'Intermediate',
        yearsOfExperience: yearsOfExperience || 1,
        description: description || '',
      });

      // Increment skill popularity
      await Skill.findByIdAndUpdate(skillId, { $inc: { popularity: 1 } });
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('skillsToTeach.skill', 'name category icon')
      .populate('skillsToLearn.skill', 'name category icon');

    res.status(200).json({
      success: true,
      message: 'Teaching skill saved successfully',
      data: updatedUser.skillsToTeach,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove skill from skillsToTeach
// @route   DELETE /api/users/skills/teach/:skillId
// @access  Private
exports.removeTeachSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const user = await User.findById(req.user.id);

    user.skillsToTeach = user.skillsToTeach.filter(
      (item) => item.skill.toString() !== skillId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Teaching skill removed successfully',
      data: user.skillsToTeach,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update skill to learn
// @route   POST /api/users/skills/learn
// @access  Private
exports.addLearnSkill = async (req, res, next) => {
  try {
    const { skillId, level, desiredOutcome } = req.body;

    if (!skillId) {
      return next(new ErrorResponse('Please select a skill', 400));
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      return next(new ErrorResponse('Skill not found', 404));
    }

    const user = await User.findById(req.user.id);

    // Check if skill already exists in skillsToLearn
    const existingIndex = user.skillsToLearn.findIndex(
      (item) => item.skill.toString() === skillId
    );

    if (existingIndex > -1) {
      // Update existing
      user.skillsToLearn[existingIndex].level = level || user.skillsToLearn[existingIndex].level;
      if (desiredOutcome !== undefined) {
        user.skillsToLearn[existingIndex].desiredOutcome = desiredOutcome;
      }
    } else {
      // Add new
      user.skillsToLearn.push({
        skill: skillId,
        level: level || 'Beginner',
        desiredOutcome: desiredOutcome || '',
        progress: 0,
        sessionsCompleted: 0,
      });

      // Increment skill popularity
      await Skill.findByIdAndUpdate(skillId, { $inc: { popularity: 1 } });
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('skillsToTeach.skill', 'name category icon')
      .populate('skillsToLearn.skill', 'name category icon');

    res.status(200).json({
      success: true,
      message: 'Learning skill saved successfully',
      data: updatedUser.skillsToLearn,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove skill from skillsToLearn
// @route   DELETE /api/users/skills/learn/:skillId
// @access  Private
exports.removeLearnSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const user = await User.findById(req.user.id);

    user.skillsToLearn = user.skillsToLearn.filter(
      (item) => item.skill.toString() !== skillId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Learning skill removed successfully',
      data: user.skillsToLearn,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user availability schedule
// @route   PUT /api/users/availability
// @access  Private
exports.updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return next(new ErrorResponse('Availability must be an array of schedule items', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { availability },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Availability schedule updated',
      data: user.availability,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update progress on a skill being learned
// @route   PUT /api/users/skills/progress
// @access  Private
exports.updateLearningProgress = async (req, res, next) => {
  try {
    const { skillId, progress, sessionsCompleted } = req.body;

    if (!skillId) {
      return next(new ErrorResponse('Skill ID is required', 400));
    }

    const user = await User.findById(req.user.id);
    const learnSkill = user.skillsToLearn.find(
      (item) => item.skill.toString() === skillId
    );

    if (!learnSkill) {
      return next(new ErrorResponse('You are not currently learning this skill', 404));
    }

    if (progress !== undefined) {
      learnSkill.progress = Math.min(100, Math.max(0, Number(progress)));
    }
    if (sessionsCompleted !== undefined) {
      learnSkill.sessionsCompleted = Number(sessionsCompleted);
    }
    learnSkill.lastLearned = new Date();

    // If progress reaches 100%, increment skillsLearnedCount
    const allCompleted = user.skillsToLearn.filter((s) => s.progress === 100).length;
    user.skillsLearnedCount = allCompleted;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Learning progress updated',
      data: learnSkill,
    });
  } catch (error) {
    next(error);
  }
};
