const mongoose = require('mongoose');
const config = require('./index');

const retryConnection = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`MongoDB 连接失败 (${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw new Error('MongoDB 连接重试次数已用完');
};

const connectMongo = async () => {
  if (config.useMockDb) {
    console.log('📦 Mock MongoDB 模式');
    return;
  }
  
  try {
    mongoose.set('strictQuery', true);
    
    const mongoConfig = {
      maxPoolSize: config.nodeEnv === 'production' ? 20 : 10,
            minPoolSize: config.nodeEnv === 'production' ? 5 : 1,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            w: 'majority'
    };

    await retryConnection(() => mongoose.connect(config.db.mongo.uri, mongoConfig));
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('🔌 MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('close', () => {
  console.warn('🔌 MongoDB connection closed');
});

const disconnectMongo = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected gracefully');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = {
  connectMongo,
  disconnectMongo,
  mongoose
};
