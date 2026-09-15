const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      required: [true, 'Connection reference is required'],
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
      index: true,
    },
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner reference is required'],
      index: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 18:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide a valid start time in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 19:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide a valid end time in HH:MM format'],
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    progressUpdated: {
      type: Boolean,
      default: false,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ teacher: 1, date: 1 });
sessionSchema.index({ learner: 1, date: 1 });

module.exports = mongoose.model('Session', sessionSchema);
