const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  socketId: { type: String },
  device: { type: String },
  lastActiveTime: { type: Number }
}, {
  collection: 'user_sessions',
  timestamps: false
});

module.exports = mongoose.model('UserSession', userSessionSchema);
