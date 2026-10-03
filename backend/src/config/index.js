const path = require('path');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

if (isProd) {
  const required = ['JWT_SECRET', 'DB_PASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`生产环境必须设置以下环境变量: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET 长度不得少于 32 字符');
  }
}

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, ''),
  nodeEnv,
  useMockDb: process.env.USE_MOCK_DB === 'true',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  db: {
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      name: process.env.DB_NAME || 'eudazi',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
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
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/eudazi_peer'
    },
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined
    }
  },
  
  storage: {
    // 支持「多家组合」：逗号分隔按优先级尝试，例如 cos,qiniu,oss,local
    // 未配置或上传失败的 provider 自动跳过，最终至少回落到本地存储
    provider: process.env.STORAGE_PROVIDER || 'local',
    // 链首失败是否继续尝试下一家（默认开启，可用性优先）；设为 false 则失败即报错
    fallback: process.env.STORAGE_FALLBACK !== 'false',
    cos: {
      secretId: process.env.COS_SECRET_ID,
      secretKey: process.env.COS_SECRET_KEY,
      bucket: process.env.COS_BUCKET,
      region: process.env.COS_REGION
    },
    qiniu: {
      accessKey: process.env.QINIU_ACCESS_KEY,
      secretKey: process.env.QINIU_SECRET_KEY,
      bucket: process.env.QINIU_BUCKET,
      domain: process.env.QINIU_DOMAIN
    },
    oss: {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      region: process.env.OSS_REGION,
      endpoint: process.env.OSS_ENDPOINT,
      domain: process.env.OSS_DOMAIN
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
    sign: process.env.SMS_SIGN || 'eu搭子',
    templateId: process.env.SMS_TEMPLATE_ID,
    notifyTemplateId: process.env.SMS_NOTIFY_TEMPLATE_ID
  },
  
  trtc: {
    appId: process.env.TRTC_APP_ID,
    secretKey: process.env.TRTC_SECRET_KEY
  },

  // 通话通道策略：自建 WebRTC 为主，腾讯云 TRTC 为备选（需显式开启）
  //   CALL_CHANNEL=webrtc（默认）→ 只走自建 WebRTC（Socket.IO 信令 + STUN/TURN）
  //   CALL_CHANNEL=trtc          → 走腾讯云 TRTC（此时才需要配置 TRTC_APP_ID/SECRET_KEY）
  call: {
    channel: (process.env.CALL_CHANNEL || 'webrtc').toLowerCase() === 'trtc' ? 'trtc' : 'webrtc',
    stun: (process.env.STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    turn: {
      // coturn REST API 模式：只配 URL + 共享密钥，凭据由后端按用户签发（临时、可过期）
      url: process.env.TURN_URL || '',
      secret: process.env.TURN_SECRET || '',
      ttl: parseInt(process.env.TURN_TTL) || 3600
    }
  },

  llm: {
    enabled: process.env.LLM_ENABLED === 'true',
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS) || 15000,
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES) || 1,
    maxContextMessages: parseInt(process.env.LLM_MAX_CONTEXT_MESSAGES) || 20
  },

  virtualUser: {
    // 单个会话（虚拟用户+真实用户）保留的最大聊天记录条数，超出后自动裁剪最旧记录
    chatHistoryLimit: parseInt(process.env.VIRTUAL_USER_CHAT_HISTORY_LIMIT) || 200
  },
  
  admin: {
    token: process.env.ADMIN_TOKEN,
    // 应急备用登录：仅当显式设置 ADMIN_EMERGENCY_LOGIN=true 时，才允许数据库不可用时用环境变量账号登录（默认关闭）
    emergencyLogin: process.env.ADMIN_EMERGENCY_LOGIN === 'true'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  cors: {
    // 支持逗号分隔的多个允许来源；生产环境务必填具体前端域名，禁用 '*'
    origin: (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  },
  
  paths: {
    root: path.resolve(__dirname, '..'),
    // 注意：静态目录由 server.js 挂载自 backend/public/uploads，此处必须与之保持一致
    public: path.resolve(__dirname, '../../public'),
    uploads: path.resolve(__dirname, '../../public/uploads'),
    // 与 docker-compose 的 eudazi_logs 卷（/var/log/eudazi）保持一致；生产可用 LOGS_PATH 覆盖
    logs: path.resolve(__dirname, '../../logs'),
    certs: path.resolve(__dirname, '../cert')
  }
};
