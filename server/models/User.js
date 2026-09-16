const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const teachSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    yearsOfExperience: {
      type: Number,
      default: 1,
      min: 0,
      max: 50,
    },
    description: {
      type: String,
      maxlength: 300,
      default: '',
    },
    endorsements: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        comment: {
          type: String,
          default: '',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    endorsementsCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const learnSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
    desiredOutcome: {
      type: String,
      maxlength: 300,
      default: '',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLearned: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const availabilitySlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true, // e.g. "18:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "21:00"
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      required: true,
    },
    slots: [availabilitySlotSchema],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    profileImage: {
      url: {
        type: String,
        default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      publicId: {
        type: String,
        default: '',
      },
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    occupation: {
      type: String,
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
      default: '',
    },
    education: {
      type: String,
      maxlength: [150, 'Education cannot exceed 150 characters'],
      default: '',
    },
    experience: {
      type: String,
      maxlength: [500, 'Experience summary cannot exceed 500 characters'],
      default: '',
    },
    skillsToTeach: [teachSkillSchema],
    skillsToLearn: [learnSkillSchema],
    availability: [availabilitySchema],
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    ratingBreakdown: {
      communication: { type: Number, default: 5.0 },
      technicalMastery: { type: Number, default: 5.0 },
      punctuality: { type: Number, default: 5.0 },
      helpfulness: { type: Number, default: 5.0 },
    },
    ratingDistribution: {
      fiveStar: { type: Number, default: 0 },
      fourStar: { type: Number, default: 0 },
      threeStar: { type: Number, default: 0 },
      twoStar: { type: Number, default: 0 },
      oneStar: { type: Number, default: 0 },
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    learnersHelped: {
      type: Number,
      default: 0,
    },
    skillsLearnedCount: {
      type: Number,
      default: 0,
    },
    timeCredits: {
      type: Number,
      default: 5,
      min: 0,
    },
    escrowCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    streak: {
      current: {
        type: Number,
        default: 1,
      },
      longest: {
        type: Number,
        default: 1,
      },
      lastActiveDate: {
        type: Date,
        default: Date.now,
      },
    },
    badges: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, default: '🏆' },
        description: { type: String, default: '' },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    milestones: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        category: { type: String, default: 'general' },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    roadmapsProgress: [
      {
        roadmapId: { type: String, required: true },
        completedTopics: [{ type: String }],
        progress: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
userSchema.index({
  name: 'text',
  username: 'text',
  bio: 'text',
  occupation: 'text',
  location: 'text',
});

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
