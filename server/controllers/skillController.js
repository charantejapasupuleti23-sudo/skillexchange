const Skill = require('../models/Skill');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all skills with optional search & category filter
// @route   GET /api/skills
// @access  Public
exports.getSkills = async (req, res, next) => {
  try {
    const { category, search, sort = 'name' } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let sortOptions = { name: 1 };
    if (sort === 'popularity') {
      sortOptions = { popularity: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const skills = await Skill.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single skill by ID with stats
// @route   GET /api/skills/:id
// @access  Public
exports.getSkillById = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return next(new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404));
    }

    // Count teachers and learners for this skill
    const teachersCount = await User.countDocuments({ 'skillsToTeach.skill': skill._id });
    const learnersCount = await User.countDocuments({ 'skillsToLearn.skill': skill._id });

    res.status(200).json({
      success: true,
      data: {
        ...skill.toObject(),
        teachersCount,
        learnersCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new skill
// @route   POST /api/skills
// @access  Private
exports.createSkill = async (req, res, next) => {
  try {
    const { name, category, description, icon } = req.body;

    if (!name || !category) {
      return next(new ErrorResponse('Please provide both skill name and category', 400));
    }

    // Check if skill already exists (case-insensitive)
    const existing = await Skill.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return next(new ErrorResponse(`Skill "${name}" already exists`, 400));
    }

    const skill = await Skill.create({
      name: name.trim(),
      category,
      description: description || '',
      icon: icon || 'Code',
    });

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: skill,
    });
  } catch (error) {
    next(error);
  }
};
