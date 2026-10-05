const jwt = require('jsonwebtoken');
const config = require('./index');

// 审计 H-4：令牌必须自带用途声明。
// 此前 access / refresh / 管理员令牌同一个密钥、payload 里没有任何 type，
// 一枚 30 天的 refresh token 可以直接当 Bearer 访问所有业务接口（泄漏后与短时效令牌无法区分），
// 管理员令牌也一样能跨用途使用。现在签发一律写 type，校验方按用途白名单接受。
// ⚠️ 没有 type 的历史令牌一律判为无效——上线后所有既有会话需重新登录（属预期行为变更）。
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  ADMIN: 'admin',
  ADMIN_REFRESH: 'admin_refresh'
};

const TOKEN_TYPE_VALUES = Object.values(TOKEN_TYPES);
const REFRESH_LIKE_TYPES = [TOKEN_TYPES.REFRESH, TOKEN_TYPES.ADMIN_REFRESH];

// 审计 M-3：管理端令牌与用户端令牌使用**不同**的签名密钥（config.jwt.adminSecret 与
// config.jwt.secret），用错密钥签发的令牌在验签阶段即失败，不再只靠 payload 里的 role 声明区分。
const ADMIN_TYPES = [TOKEN_TYPES.ADMIN, TOKEN_TYPES.ADMIN_REFRESH];

const isAdminType = (type) => ADMIN_TYPES.includes(type);

// 校验方按白名单挑选密钥：白名单整体属于管理端用途时用 adminSecret，否则用用户端 secret。
// 鉴权入口都会显式传白名单，所以这里不存在「拿用户密钥去验管理端令牌」的歧义。
const secretForTypes = (allowedTypes) => {
  if (Array.isArray(allowedTypes) && allowedTypes.length > 0 && allowedTypes.every(isAdminType)) {
    return config.jwt.adminSecret;
  }
  return config.jwt.secret;
};

const assertTokenType = (type, signer) => {
  if (!TOKEN_TYPE_VALUES.includes(type)) {
    throw new Error(`${signer} 必须指定合法 type，收到: ${type}`);
  }
  return type;
};

const generateToken = (payload, type = TOKEN_TYPES.ACCESS) => {
  assertTokenType(type, 'generateToken');
  const expiresIn = REFRESH_LIKE_TYPES.includes(type) ? config.jwt.refreshExpiresIn : config.jwt.expiresIn;
  return jwt.sign({ ...payload, type }, secretForTypes([type]), { expiresIn });
};

const generateTokenPair = (payload) => {
  const accessToken = generateToken(payload, TOKEN_TYPES.ACCESS);
  const refreshToken = generateToken(payload, TOKEN_TYPES.REFRESH);
  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
    refreshExpiresIn: config.jwt.refreshExpiresIn
  };
};

// allowedTypes 省略时只验签不判用途；所有鉴权入口都必须显式传白名单。
// 审计 M-3：密钥按白名单选择——管理端白名单用 adminSecret，其余用用户端 secret。
// 审计低危项：显式固定签发算法为 HS256。jsonwebtoken 的 verify 若不限定 algorithms，
// 会接受令牌头部声明的任意算法；把白名单锁死为 HS256 可挡掉 alg 混淆/降级类构造
// （HS384/HS512 以及把 alg 改成 none 的伪造令牌——即便库在密钥非空时会拒绝 none，
// 这里也一并显式收口）。
const ALLOWED_ALGORITHMS = ['HS256'];

const verifyToken = (token, allowedTypes = null) => {
  try {
    const decoded = jwt.verify(token, secretForTypes(allowedTypes), { algorithms: ALLOWED_ALGORITHMS });
    if (allowedTypes && !allowedTypes.includes(decoded.type)) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

const refreshAccessToken = (refreshToken) => {
  const decoded = verifyToken(refreshToken, [TOKEN_TYPES.REFRESH]);
  if (!decoded) {
    throw new Error('无效的refresh token');
  }

  // 重签只结转 userId：旧实现里 `const { userId, exp, iat, ...payload } = decoded` 的 payload
  // 是从未使用的死代码，一旦被后续改动直接拿去签名，refresh 令牌里伪造的 role/permissions
  // 就会被洗进新的 access 令牌，这里用显式白名单把它锁死。
  const newAccessToken = generateToken({ userId: decoded.userId }, TOKEN_TYPES.ACCESS);
  const newRefreshToken = generateToken({ userId: decoded.userId }, TOKEN_TYPES.REFRESH);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: config.jwt.expiresIn
  };
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

// 管理端签发：expiresIn 由调用方给定（历史上各处不一致），type 一律强制。
// 审计 M-3：管理端用途的令牌用独立密钥（config.jwt.adminSecret）签名。
const signToken = (payload, expiresIn, type) => {
  assertTokenType(type, 'signToken');
  return jwt.sign({ ...payload, type }, secretForTypes([type]), { expiresIn });
};

module.exports = {
  TOKEN_TYPES,
  generateToken,
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
  decodeToken,
  signToken
};
