const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  peerId: {
    type: Number,
    required: true
  },
  peerName: {
    type: String,
    default: ''
  },
  peerAvatar: {
    type: String,
    default: ''
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageType: {
    type: Number,
    default: 0
  },
  lastMessageTime: {
    type: Number,
    default: 0
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  updateTime: {
    type: Number,
    default: () => Date.now()
  }
}, {
  timestamps: false,
  collection: 'user_sessions'
});

userSessionSchema.index({ userId: 1 });
userSessionSchema.index({ updateTime: -1 });
userSessionSchema.index({ userId: 1, peerId: 1 }, { unique: true });

module.exports = mongoose.model('UserSession', userSessionSchema);
