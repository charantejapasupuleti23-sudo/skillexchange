const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    skill: {
      type: String,
      default: 'General',
    },
    takeaway: {
      type: String,
      required: [true, 'Please share your key learning takeaway'],
      maxlength: [2000, 'Takeaway cannot exceed 2000 characters'],
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Highlight', highlightSchema);
