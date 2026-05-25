const { generateToken, generateTokenPair, verifyToken, refreshAccessToken } = require('../config/jwt');
const { User, UserFollow } = require('../models');
const bcrypt = require('bcryptjs');
const { getTimestamp } = require('../utils/helper');
const { Op } = require('sequelize');

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
  
  const tokens = generateTokenPair({ userId: user.id });
  
  return {
    userId: user.id,
    ...tokens,
    nickname: user.nickname
  };
};

const loginWithMobile = async (mobile, code, deviceId, platform = 'app') => {
  let user = await User.findOne({ where: { mobile } });
  
  if (!user) {
    user = await User.create({
      mobile,
      nickname: `用户${mobile.slice(-4)}`,
      platform,
      create_time: getTimestamp(),
      last_login_time: getTimestamp()
    });
  } else {
    await user.update({
      last_login_time: getTimestamp()
    });
  }
  
  const tokens = generateTokenPair({ userId: user.id });
  
  return {
    userId: user.id,
    ...tokens,
    nickname: user.nickname
  };
};

const loginWithThird = async (type, code, encryptedData, iv) => {
  let openId;
  
  if (type === 'wechat') {
    openId = code;
  } else if (type === 'apple') {
    openId = code;
  }
  
  let user = await User.findOne({
    where: type === 'wechat' ? { open_id: openId } : { unionid: openId }
  });
  
  if (!user) {
    user = await User.create({
      open_id: type === 'wechat' ? openId : null,
      unionid: type !== 'wechat' ? openId : null,
      nickname: `${type}用户`,
      platform: type,
      create_time: getTimestamp(),
      last_login_time: getTimestamp()
    });
  } else {
    await user.update({
      last_login_time: getTimestamp()
    });
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
    score: user.score,
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

const followUser = async (userId, targetUserId) => {
  if (userId === targetUserId) {
    throw new Error('不能关注自己');
  }
  
  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new Error('目标用户不存在');
  }
  
  const existingFollow = await UserFollow.findOne({
    where: { user_id: userId, target_user_id: targetUserId }
  });
  
  if (existingFollow) {
    await existingFollow.destroy();
    await User.decrement('fans_num', { where: { id: targetUserId } });
    await User.decrement('fans_num', { where: { id: userId } });
    return { isFollow: false };
  }
  
  await UserFollow.create({
    user_id: userId,
    target_user_id: targetUserId,
    create_time: getTimestamp()
  });
  
  await User.increment('fans_num', { where: { id: targetUserId } });
  await User.increment('fans_num', { where: { id: userId } });
  
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
      where: { user_id: userId, target_user_id: targetUserId }
    });
    isFollow = !!follow;
  }
  
  return {
    userId: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    city: user.city,
    level: user.lv,
    vip: user.vip,
    vipLevel: user.vip_lv,
    balance: user.money,
    giftBalance: user.gift_money,
    score: user.score,
    fansCount: user.fans_num,
    isFollow,
    description: user.dec,
    sex: user.sex
  };
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
