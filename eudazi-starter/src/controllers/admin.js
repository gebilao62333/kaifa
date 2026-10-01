// 管理员控制器：仅负责登录签发令牌。下载管理接口复用 download 控制器。
const crypto = require('crypto');
const response = require('../utils/response');
const config = require('../config');
const { signToken } = require('../config/jwt');

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

const login = (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return response.badRequest(res, '用户名和密码不能为空');
    if (!safeEqual(username, config.admin.username) || !safeEqual(password, config.admin.password)) {
      return response.unauthorized(res, '用户名或密码错误');
    }
    const token = signToken({ role: 'admin', role_id: 1, username });
    return response.success(res, { token }, '登录成功');
  } catch (e) {
    return response.error(res, '登录失败: ' + e.message);
  }
};

module.exports = { login };
