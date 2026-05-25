const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createTime: {
    type: Number,
    default: () => Date.now()
  }
}, {
  timestamps: false,
  collection: 'notifications'
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
