const mongoose = require('mongoose');

// U-22：用户黑名单（Mongo 存储，避免为一张小表做 MySQL 迁移）
const userBlockSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  blockedUserId: { type: Number, required: true },
  createTime: { type: Number, required: true }
}, {
  collection: 'user_blocks',
  timestamps: false
});

userBlockSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
userBlockSchema.index({ blockedUserId: 1 });

module.exports = mongoose.model('UserBlock', userBlockSchema);
