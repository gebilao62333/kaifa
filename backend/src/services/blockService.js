const mongoose = require('mongoose');
const { UserBlock, User } = require('../models');
const logger = require('../utils/logger');

// U-22：黑名单服务。双向判定：A 拉黑 B 或 B 拉黑 A，聊天都应被拒绝。
const block = async (userId, targetUserId) => {
  const uid = Number(userId);
  const target = Number(targetUserId);
  if (!uid || !target) throw new Error('用户ID不能为空');
  if (uid === target) throw new Error('不能拉黑自己');
  const targetUser = await User.findByPk(target);
  if (!targetUser) throw new Error('用户不存在');
  await UserBlock.updateOne(
    { userId: uid, blockedUserId: target },
    { $setOnInsert: { createTime: Math.floor(Date.now() / 1000) } },
    { upsert: true }
  );
  return true;
};

const unblock = async (userId, targetUserId) => {
  const uid = Number(userId);
  const target = Number(targetUserId);
  if (!uid || !target) throw new Error('用户ID不能为空');
  await UserBlock.deleteOne({ userId: uid, blockedUserId: target });
  return true;
};

const listBlocked = async (userId) => {
  const rows = await UserBlock.find({ userId: Number(userId) }).sort({ createTime: -1 }).lean();
  const ids = rows.map((row) => Number(row.blockedUserId)).filter(Boolean);
  if (ids.length === 0) return [];
  const users = await User.findAll({ where: { id: ids }, attributes: ['id', 'nickname', 'avatar'] });
  const map = new Map(users.map((u) => [Number(u.id), u]));
  return ids.map((id) => {
    const user = map.get(id);
    return {
      userId: id,
      nickname: user ? (user.nickname || '') : '',
      avatar: user ? (user.avatar || '') : '',
      createTime: Number((rows.find((r) => Number(r.blockedUserId) === id) || {}).createTime) || 0
    };
  });
};

const isBlockedEither = async (userId, targetUserId) => {
  const uid = Number(userId);
  const target = Number(targetUserId);
  if (!uid || !target) return false;
  try {
    const hit = await UserBlock.findOne({
      $or: [
        { userId: uid, blockedUserId: target },
        { userId: target, blockedUserId: uid }
      ]
    }).lean();
    return !!hit;
  } catch (error) {
    // 黑名单查询失败不能阻断正常聊天（fail-open），只记录日志
    logger.error('[黑名单] 查询失败，按未拉黑处理:', error.message);
    return false;
  }
};

module.exports = { block, unblock, listBlocked, isBlockedEither };
