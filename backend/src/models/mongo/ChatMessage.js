const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  fromUserId: { type: Number, required: true },
  toUserId: { type: Number, required: true },
  content: { type: String },
  type: { type: Number, default: 0, enum: [0, 1, 2, 3, 4, 5, 6, 7] },
  mediaUrl: { type: String },
  duration: { type: Number, default: 0 },
  status: { type: Number, default: 1, enum: [1, 2] },
  createTime: { type: Number, required: true }
}, {
  collection: 'chat_messages',
  timestamps: false
});

chatMessageSchema.index({ fromUserId: 1, toUserId: 1, createTime: -1 });
chatMessageSchema.index({ createTime: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
