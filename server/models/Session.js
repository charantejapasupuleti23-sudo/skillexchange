const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
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
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected', 'Rescheduled', 'No-Show'],
      default: 'Pending',
      index: true,
    },
    // Escrow & Time-Banking Wallet
    creditCost: {
      type: Number,
      default: 1,
      min: 0,
    },
    escrowStatus: {
      type: String,
      enum: ['held', 'released', 'refunded'],
      default: 'held',
    },
    // Mutual Completion & Check-in
    confirmedByTeacher: {
      type: Boolean,
      default: false,
    },
    confirmedByLearner: {
      type: Boolean,
      default: false,
    },
    teacherCheckedInAt: {
      type: Date,
    },
    learnerCheckedInAt: {
      type: Date,
    },
    // Integrated Session Workspace & Scratchpad
    workspaceNotes: {
      type: String,
      default: '',
      maxlength: [10000, 'Workspace notes cannot exceed 10000 characters'],
    },
    workspaceCode: {
      type: String,
      default: '// Write or collaborate on code here during your session\nfunction solveProblem() {\n  return "SkillLoop Collaborative Session";\n}',
    },
    workspaceLanguage: {
      type: String,
      default: 'javascript',
    },
    // Booking Slot Reference
    availabilitySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Availability',
    },
    progressUpdated: {
      type: Boolean,
      default: false,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    endorsedSkill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ teacher: 1, date: 1 });
sessionSchema.index({ learner: 1, date: 1 });

module.exports = mongoose.model('Session', sessionSchema);
