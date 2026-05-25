const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: Number,
    required: true
  },
  senderName: {
    type: String,
    default: ''
  },
  senderAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: Number,
    default: 0
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  sendTime: {
    type: Number,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  createTime: {
    type: Number,
    default: () => Date.now()
  }
}, {
  timestamps: false,
  collection: 'chat_messages'
});

chatMessageSchema.index({ senderId: 1, sendTime: -1 });
chatMessageSchema.index({ createTime: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
