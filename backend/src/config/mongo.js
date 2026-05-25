const mongoose = require('mongoose');
const config = require('./index');

const connectMongo = async () => {
  if (config.useMockDb) {
    console.log('📦 Mock MongoDB 模式');
    return;
  }
  
  try {
    await mongoose.connect(config.db.mongo.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

module.exports = connectMongo;
