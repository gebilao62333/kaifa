// 集中式配置：从环境变量读取，缺失时使用合理默认值。
// 仅依赖 dotenv，不耦合任何外部服务（DB/Redis），保证可独立启动。
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'eudazi-dev-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    // 可选的应急固定令牌，配置后可作为 x-admin-token 直接放行
    token: process.env.ADMIN_TOKEN || '',
  },
};

module.exports = config;
