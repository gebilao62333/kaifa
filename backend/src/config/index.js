const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  useMockDb: process.env.USE_MOCK_DB === 'true',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  db: {
    mysql: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      name: process.env.DB_NAME || 'duoke_peer',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: process.env.DB_CHARSET || 'utf8mb4',
      pool: {
        max: parseInt(process.env.DB_POOL_MAX) || (process.env.NODE_ENV === 'production' ? 30 : 10),
        min: parseInt(process.env.DB_POOL_MIN) || (process.env.NODE_ENV === 'production' ? 5 : 0),
        acquire: 30000,
        idle: 10000,
        evict: 1000,
        maxUses: 10000
      },
      retry: {
        max: 3
      }
    },
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/duoke_peer'
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      username: process.env.REDIS_USERNAME || undefined
    }
  },
  
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'cos',
    cos: {
      secretId: process.env.COS_SECRET_ID,
      secretKey: process.env.COS_SECRET_KEY,
      bucket: process.env.COS_BUCKET,
      region: process.env.COS_REGION
    },
    qiniu: {
      accessKey: process.env.QINIU_ACCESS_KEY,
      secretKey: process.env.QINIU_SECRET_KEY,
      bucket: process.env.QINIU_BUCKET
    }
  },
  
  wechat: {
    appid: process.env.WECHAT_APPID,
    mchid: process.env.WECHAT_MCHID,
    apiKey: process.env.WECHAT_API_KEY,
    certPath: process.env.WECHAT_CERT_PATH
  },
  
  alipay: {
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    publicKey: process.env.ALIPAY_PUBLIC_KEY
  },
  
  sms: {
    appId: process.env.SMS_APP_ID,
    secretId: process.env.SMS_SECRET_ID,
    secretKey: process.env.SMS_SECRET_KEY,
    sign: process.env.SMS_SIGN || '多客陪玩',
    templateId: process.env.SMS_TEMPLATE_ID,
    notifyTemplateId: process.env.SMS_NOTIFY_TEMPLATE_ID
  },
  
  trtc: {
    appId: process.env.TRTC_APP_ID,
    secretKey: process.env.TRTC_SECRET_KEY
  },
  
  admin: {
    token: process.env.ADMIN_TOKEN
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  
  paths: {
    root: path.resolve(__dirname, '..'),
    uploads: path.resolve(__dirname, '../public/uploads'),
    logs: path.resolve(__dirname, '../logs'),
    certs: path.resolve(__dirname, '../cert')
  }
};
