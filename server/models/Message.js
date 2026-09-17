const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    content: {
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
    type: {
      type: String,
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

messageSchema.pre('save', function (next) {
  if (!this.sender && this.senderId) this.sender = this.senderId;
  if (!this.senderId && this.sender) this.senderId = this.sender;
  if (!this.receiver && this.receiverId) this.receiver = this.receiverId;
  if (!this.receiverId && this.receiver) this.receiverId = this.receiver;
  if (!this.text && this.content) this.text = this.content;
  if (!this.content && this.text) this.content = this.text;
  if (!this.type && this.messageType) this.type = this.messageType;
  if (!this.messageType && this.type) this.messageType = this.type;
  next();
});

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

