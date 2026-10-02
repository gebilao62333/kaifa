const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  type: { type: Number, required: true },
  title: { type: String },
  content: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createTime: { type: Number, required: true }
}, {
  collection: 'notifications',
  timestamps: false
});

notificationSchema.index({ userId: 1, read: 1, createTime: -1 });
notificationSchema.index({ type: 1, createTime: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
