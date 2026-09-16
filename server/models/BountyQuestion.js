const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [5000, 'Answer cannot exceed 5000 characters'],
    },
    codeSnippet: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
    },
    accepted: {
      type: Boolean,
      default: false,
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

const bountyQuestionSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide question title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide question details or error log'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    skill: {
      type: String,
      default: 'General',
      index: true,
    },
    codeSnippet: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
    },
    tags: [{ type: String, trim: true }],
    bounty: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true,
    },
    answers: [answerSchema],
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BountyQuestion', bountyQuestionSchema);
