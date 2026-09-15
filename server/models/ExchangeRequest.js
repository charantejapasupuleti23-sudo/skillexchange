const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
      index: true,
    },
    teachSkill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Offered skill is required'],
    },
    learnSkill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Desired skill is required'],
    },
    message: {
      type: String,
      required: [true, 'Request message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending requests for the same pairing
exchangeRequestSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { partialFilterExpression: { status: 'Pending' } }
);

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);
