const jwt = require('jsonwebtoken');
const config = require('./index');

const generateToken = (payload, type = 'access') => {
  const expiresIn = type === 'access' ? config.jwt.expiresIn : config.jwt.refreshExpiresIn;
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
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
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

const refreshAccessToken = (refreshToken) => {
  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    throw new Error('无效的refresh token');
  }
  
  const { userId, exp, iat, ...payload } = decoded;
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
