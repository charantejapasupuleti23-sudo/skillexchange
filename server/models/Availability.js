const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor is required'],
      index: true,
    },
    dayOfWeek: {
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
    date: {
      type: Date, // Optional specific date if not recurring
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 10:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide valid start time in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 11:00)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide valid end time in HH:MM format'],
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bookedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    skillFocus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

availabilitySlotSchema.index({ mentor: 1, dayOfWeek: 1, isBooked: 1 });

module.exports = mongoose.model('Availability', availabilitySlotSchema);
