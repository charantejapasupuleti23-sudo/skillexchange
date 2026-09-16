const mongoose = require('mongoose');

const channelMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
    },
    codeSnippet: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const channelSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'Hash',
    },
    category: {
      type: String,
      default: 'General',
    },
    messages: [channelMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Channel', channelSchema);
