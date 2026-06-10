const mongoose = require('mongoose');
const config = require('./index');

let connectMongoImpl;

if (config.useMockDb) {
  // 本地模式
  console.log('📦 使用本地 MongoDB 模式（跳过外部连接）');
  connectMongoImpl = async () => {
    return;
  };
} else {
  // 真实 MongoDB 模式
  const mongoUri = config.db.mongo.uri;
  console.log(`🗄️ 连接 MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
  
  connectMongoImpl = async () => {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000
      });
      console.log('✅ MongoDB 连接成功');
    } catch (error) {
      console.error('❌ MongoDB 连接失败:', error.message);
      console.log('💡 将以本地模式继续运行');
    }
  };
}

const disconnectMongo = async () => {
  if (!config.useMockDb && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log('✅ MongoDB 已断开');
    } catch (e) {
      console.warn('⚠️ MongoDB 断开失败:', e.message);
    }
  }
};

module.exports = {
  connectMongo: connectMongoImpl,
  disconnectMongo,
  mongoose
};
