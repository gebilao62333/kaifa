const jwt = require('jsonwebtoken');
const config = require('./index');

const generateToken = (payload, type = 'access') => {
  const expiresIn = type === 'access' ? config.jwt.expiresIn : config.jwt.refreshExpiresIn;
  const tokenPayload = { ...payload, tokenType: type };
  return jwt.sign(tokenPayload, config.jwt.secret, { expiresIn });
};

const generateTokenPair = (payload) => {
  const accessToken = generateToken(payload, 'access');
  const refreshToken = generateToken(payload, 'refresh');
  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
    refreshExpiresIn: config.jwt.refreshExpiresIn
  };
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    // 返回 null 而非抛出异常，但保留错误类型用于调试
    return null;
  }
};

const refreshAccessToken = (refreshToken) => {
  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    throw new Error('无效的refresh token');
  }
  
  // 验证 token 类型：只接受 refresh token 来刷新
  if (decoded.tokenType && decoded.tokenType !== 'refresh') {
    throw new Error('只能使用refresh token来刷新');
  }
  
  const { userId } = decoded;
  const newAccessToken = generateToken({ userId }, 'access');
  const newRefreshToken = generateToken({ userId }, 'refresh');
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: config.jwt.expiresIn
  };
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

const signToken = (payload, expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

module.exports = {
  generateToken,
  generateTokenPair,
  verifyToken,
  refreshAccessToken,
  decodeToken,
  signToken
};
