const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    exchangeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeRequest',
    },
    sharedSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'blocked'],
      default: 'active',
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index on users array for fast lookups
connectionSchema.index({ users: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
