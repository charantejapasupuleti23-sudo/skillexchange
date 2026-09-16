const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workshop host is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Workshop title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Workshop description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Target skill is required'],
    },
    category: {
      type: String,
      default: 'Technical',
    },
    date: {
      type: Date,
      required: [true, 'Workshop date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 19:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide valid start time in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 20:30)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide valid end time in HH:MM format'],
    },
    meetingLink: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      default: 15,
      min: 2,
      max: 100,
    },
    creditCost: {
      type: Number,
      default: 1,
      min: 0,
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

workshopSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Workshop', workshopSchema);
