const path = require('path');
const crypto = require('crypto');
const { resolveTrustProxy } = require('./trustProxy');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';

// 审计 M-3：管理端令牌此前与用户端令牌共用同一密钥，仅靠 payload 里的 role 声明区分，
// 属于纵深防御缺失（用户端密钥泄露、或将来用户令牌带上 role 字段，即可伪造管理员身份）。
// 现改用独立密钥：显式配置 ADMIN_JWT_SECRET 时完全隔离；未配置时用 HMAC-SHA256 + 固定标签
// 从 JWT_SECRET 派生出**不同**的密钥材料，保证两类令牌互不通用（用错密钥签名直接验签失败）。
// ⚠️ 派生值可被掌握 JWT_SECRET 的人算出，只有显式配置 ADMIN_JWT_SECRET 才是泄露隔离。
const derivedAdminSecret = crypto.createHmac('sha256', jwtSecret).update('eudazi:admin-token:v1').digest('hex');

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

// 审计 H-8：反代信任层级见 config/trustProxy.js；这里只做解析，取值非法即拒绝启动。
const trustProxySetting = resolveTrustProxy(process.env.TRUST_PROXY);

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, ''),
  nodeEnv,
  // 审计 H-8：NODE_ENV 缺省即 development，而所有限流器原先都按它整体放行。
  // 这里显式导出「是否由运维设定」，供启动自检告警使用（见 server.js collectConfigRisks）。
  nodeEnvExplicit: Boolean(process.env.NODE_ENV),
  useMockDb: process.env.USE_MOCK_DB === 'true',
  trustProxy: trustProxySetting.value,
  trustProxySource: trustProxySetting.source,
  
  jwt: {
    secret: jwtSecret,
    // 审计 M-3：管理端令牌独立密钥（与用户端分离），见文件顶部说明。
    // adminSecretSource 供启动自检判断是否需要提示「未做泄露隔离」。
    adminSecret: process.env.ADMIN_JWT_SECRET || derivedAdminSecret,
    adminSecretSource: process.env.ADMIN_JWT_SECRET ? 'env' : 'derived',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    // 审计 M-2：管理端访问令牌单独定时效，不再与用户端共用 7 天。
    // 后台权限/状态每次请求实时回读数据库，这里决定的是「凭令牌本身还能活多久」——
    // 默认 12h（一个工作日），可用 ADMIN_JWT_EXPIRES_IN 调整（支持 s/m/h/d，如 '2h'、'1d'）
    adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h'
  },

  // 审计 M-8：实名信息（真实姓名/身份证号/正反面照）静态加密密钥（AES-256-GCM，见 utils/pii.js）。
  // 生产环境缺失即拒绝启动（server.js 强制校验），非生产缺失时回落明文存储并告警。
  pii: {
    encryptionKey: process.env.PII_ENCRYPTION_KEY || '',
    // 审计 B-9：密钥轮换窗口内的「上一把钥匙」。仅在轮换期间配置：
    // 解密会依次尝试 当前 ← 上一把；用 scripts/rotate-pii-key.js 重加密存量后再移除。
    encryptionKeyPrevious: process.env.PII_ENCRYPTION_KEY_PREVIOUS || ''
  },
  
  db: {
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      name: process.env.DB_NAME || 'eudazi',
      user: process.env.DB_USER || 'root',
      // 审计 H-9：原先兜底 '123456'，忘配 DB_PASSWORD 时会静默用弱口令连库；
      // 现在保持未设置，连接直接失败，并由启动自检打印「DB_PASSWORD 未设置或为弱值」告警。
      password: process.env.DB_PASSWORD || undefined,
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
    notifyTemplateId: process.env.SMS_NOTIFY_TEMPLATE_ID,
    // 审计 M-5：非生产环境把验证码回传给调用方（前端联调自动回填）。
    // 历史口径是 nodeEnv !== 'production'，而 NODE_ENV 未设置时 nodeEnv 会静默回落 'development'——
    // 生产机器忘配 NODE_ENV 就把验证码直接写进响应体，等同于任意账号接管。
    // 现要求「非生产」且「NODE_ENV 由运维显式声明」两个条件同时成立才回传。
    returnCodeInDev: !isProd && Boolean(process.env.NODE_ENV),
    // 测试/演示环境：短信通道未配置时，允许把本次随机验证码直接回传给调用方（前端会自动填入）。
    // 默认关闭；SMS_TEST_PHONES 非空时只对白名单手机号生效，留空则对所有手机号生效（高风险，仅限内测）。
    testMode: process.env.SMS_TEST_MODE === 'true',
    testPhones: (process.env.SMS_TEST_PHONES || '').split(',').map((s) => s.trim()).filter(Boolean)
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
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    // 审计 H-8：限流不再有「按环境整体放行」的隐含开关。确需临时关闭（压测/排障）必须显式声明，
    // 且生产环境声明它会被 server.js 的强校验拒绝启动。
    disabled: process.env.RATE_LIMIT_DISABLED === 'true',
    // 验证码发送的 IP 维度频率（服务端另有按手机号 + 场景的 60 秒冷却，见 smsService）
    smsMax: parseInt(process.env.SMS_RATE_LIMIT_MAX) || 1
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
    // Sealos/只读镜像场景下可把可写目录指到 /tmp 或挂载卷（默认仍是 backend/public/uploads）
    uploads: process.env.UPLOADS_PATH ? path.resolve(process.env.UPLOADS_PATH) : path.resolve(__dirname, '../../public/uploads'),
    // 与 docker-compose 的 eudazi_logs 卷（/var/log/eudazi）保持一致；生产可用 LOGS_PATH 覆盖
    logs: path.resolve(__dirname, '../../logs'),
    certs: path.resolve(__dirname, '../cert')
  }
};
