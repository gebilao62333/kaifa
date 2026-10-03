const crypto = require('crypto');
const axios = require('axios');
const { generateToken, generateTokenPair, verifyToken, refreshAccessToken } = require('../config/jwt');
const { User, UserFollow } = require('../models');
const bcrypt = require('bcryptjs');
const { getTimestamp } = require('../utils/helper');
const { Op } = require('sequelize');

const USER_ID_THRESHOLD = 11000

const ensureUserIdValid = async (user) => {
  if (user.id < USER_ID_THRESHOLD) {
    await user.destroy()
    throw new Error('注册失败：当前仅支持 ID 11000 后的用户注册，如有疑问请联系管理员')
  }
}

const register = async (mobile, password, nickname, platform = 'app') => {
  const existingUser = await User.findOne({ where: { mobile } });
  
  if (existingUser) {
    throw new Error('该手机号已注册');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await User.create({
    mobile,
    password: hashedPassword,
    nickname: nickname || `用户${mobile.slice(-4)}`,
    platform,
    create_time: getTimestamp(),
    last_login_time: getTimestamp()
  });
  
  await ensureUserIdValid(user)
  
  const tokens = generateTokenPair({ userId: user.id });
  
  return {
    userId: user.id,
    ...tokens,
    nickname: user.nickname
  };
};

const loginWithMobile = async (mobile, code, deviceId, platform = 'app') => {
  let user = await User.findOne({ where: { mobile } });
  let isNewUser = false
  
  if (!user) {
    user = await User.create({
      mobile,
      nickname: `用户${mobile.slice(-4)}`,
      platform,
      create_time: getTimestamp(),
      last_login_time: getTimestamp()
    });
    isNewUser = true
  } else {
    await user.update({
      last_login_time: getTimestamp()
    });
  }
  
  if (isNewUser) {
    await ensureUserIdValid(user)
  }
  
  const tokens = generateTokenPair({ userId: user.id });
  
  return {
    userId: user.id,
    ...tokens,
    nickname: user.nickname
  };
};

// ==================== 第三方登录校验 ====================
// 安全要求：授权码必须由服务端向第三方平台换取真实身份标识（openId/unionid/sub），
// 绝不允把客户端传来的 code 直接当作 openId —— 那等于允许任意人冒充任意账号登录。

const verifyWechatCode = async (code) => {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APPSECRET || process.env.WECHAT_APP_SECRET;

  if (!appid || !secret) {
    throw new Error('微信登录未配置（缺少 WECHAT_APPID / WECHAT_APPSECRET），暂不可用');
  }

  const { data } = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: { appid, secret, js_code: code, grant_type: 'authorization_code' },
    timeout: 8000
  });

  if (!data || data.errcode || !(data.openid || data.unionid)) {
    throw new Error('微信授权码校验失败: ' + ((data && data.errmsg) || '无效响应'));
  }

  return { openId: data.openid || data.unionid, unionId: data.unionid || data.openid };
};

const appleKeyCache = { keys: null, fetchedAt: 0 };

const fetchAppleKeys = async () => {
  if (appleKeyCache.keys && Date.now() - appleKeyCache.fetchedAt < 3600 * 1000) {
    return appleKeyCache.keys;
  }
  const { data } = await axios.get('https://appleid.apple.com/auth/keys', { timeout: 8000 });
  appleKeyCache.keys = (data && data.keys) || [];
  appleKeyCache.fetchedAt = Date.now();
  return appleKeyCache.keys;
};

// Apple Sign In：identityToken 是 Apple 用 RS256 签名的 JWT，必须验签 + 校验 iss/aud/exp
const verifyAppleIdentityToken = async (identityToken) => {
  if (!identityToken || String(identityToken).split('.').length !== 3) {
    throw new Error('Apple 登录需要有效的 identityToken');
  }

  const jwt = require('jsonwebtoken');
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.payload) {
    throw new Error('Apple 身份令牌格式错误');
  }

  const keys = await fetchAppleKeys();
  const jwk = keys.find((k) => k.kid === decoded.header.kid);
  if (!jwk) {
    throw new Error('Apple 公钥不匹配');
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const payload = jwt.verify(identityToken, publicKey, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com'
  });

  const expectedAud = process.env.APPLE_CLIENT_ID;
  if (expectedAud && payload.aud !== expectedAud) {
    throw new Error('Apple 令牌受众不匹配');
  }

  return { openId: payload.sub, unionId: payload.sub };
};

const loginWithThird = async (type, code) => {
  let identity;

  if (type === 'wechat') {
    identity = await verifyWechatCode(code);
  } else if (type === 'apple') {
    identity = await verifyAppleIdentityToken(code);
  } else {
    throw new Error('不支持的第三方登录类型');
  }

  let user = await User.findOne({
    where: type === 'wechat' ? { open_id: identity.openId } : { unionid: identity.openId }
  });

  let isNewUser = false

  if (!user) {
    user = await User.create({
      open_id: type === 'wechat' ? identity.openId : null,
      unionid: type !== 'wechat' ? identity.openId : null,
      nickname: type + '用户',
      platform: type,
      create_time: getTimestamp(),
      last_login_time: getTimestamp()
    });
    isNewUser = true
  } else {
    await user.update({
      last_login_time: getTimestamp()
    });
  }

  if (isNewUser) {
    await ensureUserIdValid(user)
  }

  const tokens = generateTokenPair({ userId: user.id });

  return {
    userId: user.id,
    ...tokens
  };
};

const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findByPk(userId);
  
  if (!user || !user.password) {
    throw new Error('用户不存在或未设置密码');
  }
  
  const isValid = await verifyPassword(oldPassword, user.password);
  
  if (!isValid) {
    throw new Error('原密码错误');
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await user.update({ password: hashedPassword });
  
  return true;
};

const loginWithPassword = async (username, password) => {
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { username: username },
        { mobile: username }
      ]
    }
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  if (!user.password) {
    throw new Error('该用户未设置密码');
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    throw new Error('密码错误');
  }

  await user.update({ last_login_time: getTimestamp() });

  const tokens = generateTokenPair({ userId: user.id });

  return {
    userId: user.id,
    ...tokens,
    nickname: user.nickname,
    avatar: user.avatar,
    level: user.lv,
    vip: user.vip,
    vipLevel: user.vip_lv,
    balance: user.money,
    fansCount: user.fans_num
  };
};

const refreshToken = async (refreshTokenStr) => {
  if (!refreshTokenStr) {
    throw new Error('refresh token不能为空');
  }
  
  const newTokens = refreshAccessToken(refreshTokenStr);
  
  const decoded = verifyToken(newTokens.accessToken);
  if (!decoded) {
    throw new Error('生成的token无效');
  }
  
  const user = await User.findByPk(decoded.userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  return {
    ...newTokens,
    userId: user.id,
    nickname: user.nickname,
    avatar: user.avatar
  };
};

const followUser = async (userId, targetUserId, action = 1) => {
  if (userId === targetUserId) {
    throw new Error('不能关注自己');
  }

  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new Error('目标用户不存在');
  }

  const existingFollow = await UserFollow.findOne({
    where: { follower_id: userId, following_id: targetUserId }
  });

  // action: 1=关注 0=取消关注；幂等，避免重复点击造成反复关注/取关
  // 审计 M4：关注记录与粉丝数必须同一事务，否则中途失败会出现"记录了关注但粉丝数没加"的脏数据
  if (action === 0) {
    if (existingFollow) {
      const sequelize = require('../config/mysql');
      const transaction = await sequelize.transaction();
      try {
        await existingFollow.destroy({ transaction });
        await User.decrement('fans_num', { where: { id: targetUserId }, transaction });
        await transaction.commit();
      } catch (e) {
        await transaction.rollback();
        throw e;
      }
    }
    return { isFollow: false };
  }

  if (existingFollow) {
    return { isFollow: true };
  }

  const sequelize = require('../config/mysql');
  const transaction = await sequelize.transaction();
  try {
    await UserFollow.create({
      follower_id: userId,
      following_id: targetUserId,
      create_time: getTimestamp()
    }, { transaction });

    await User.increment('fans_num', { where: { id: targetUserId }, transaction });
    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }

  return { isFollow: true };
};

const getUserInfo = async (userId, targetUserId) => {
  const user = await User.findByPk(targetUserId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  let isFollow = false;
  
  if (userId) {
    const follow = await UserFollow.findOne({
      where: { follower_id: userId, following_id: targetUserId }
    });
    isFollow = !!follow;
  }
  
  const info = {
    userId: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    city: user.city,
    level: user.lv,
    vip: user.vip,
    vipLevel: user.vip_lv,
    score: user.score,
    fansCount: user.fans_num,
    isFollow,
    description: user.dec,
    sex: user.sex
  };

  // 余额/礼物流水只对本人可见：历史实现无条件返回，
  // 任何登录用户只要带上 ?userId=别人ID 就能查到对方余额。
  if (Number(userId) === Number(targetUserId)) {
    info.balance = user.money;
    info.giftBalance = user.gift_money;
  }

  return info;
};

const updateUserInfo = async (userId, updateData) => {
  const allowedFields = ['nickname', 'avatar', 'city', 'sex', 'dec'];
  
  const filteredData = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      const dbKey = key === 'nickname' ? 'nickname' : 
                   key === 'avatar' ? 'avatar' :
                   key === 'city' ? 'city' :
                   key === 'sex' ? 'sex' : 'dec';
      filteredData[dbKey] = updateData[key];
    }
  }
  
  await User.update(filteredData, { where: { id: userId } });
  
  return true;
};

module.exports = {
  register,
  loginWithMobile,
  loginWithThird,
  loginWithPassword,
  verifyPassword,
  changePassword,
  followUser,
  getUserInfo,
  updateUserInfo,
  refreshToken
};
