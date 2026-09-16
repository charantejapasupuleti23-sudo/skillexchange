const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      required: [true, 'Conversation reference is required'],
      index: true,
    },
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
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'code', 'file', 'session_proposal'],
      default: 'text',
    },
    codeSnippet: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
    },
    fileAttachment: {
      url: { type: String, default: '' },
      name: { type: String, default: '' },
      size: { type: Number, default: 0 },
      mimeType: { type: String, default: '' },
    },
    sessionProposal: {
      skillName: { type: String, default: '' },
      skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: String, default: '' },
      startTime: { type: String, default: '' },
      endTime: { type: String, default: '' },
      meetingLink: { type: String, default: '' },
      notes: { type: String, default: '' },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
      },
      session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
