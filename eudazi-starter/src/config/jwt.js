// JWT 签发与校验封装，密钥来自统一配置，便于后续更换为密钥管理服务。
const jwt = require('jsonwebtoken');
const config = require('./index');

const signToken = (payload, expiresIn = config.jwtExpiresIn) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
};

module.exports = { signToken, verifyToken };
