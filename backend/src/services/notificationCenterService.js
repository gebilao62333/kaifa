const { Notification, UserPref } = require('../models');
const logger = require('../utils/logger');
const { parseQuery } = require('../utils/helper');

// U-12：互动通知（点赞/评论/关注/订单等）落 MongoDB，替代前端 localStorage 假数据。
// Mongo 写失败只记日志，绝不影响主业务（点赞/评论/关注不能因为通知失败而失败）。
const TYPES = {
  like: 1,
  comment: 2,
  follow: 3,
  order: 4,
  gift: 5,
  reserve: 6,
  system: 7
};

const TYPE_KEYS = {
  1: 'like',
  2: 'comment',
  3: 'follow',
  4: 'order',
  5: 'gift',
  6: 'reserve',
  7: 'system'
};

// U-20/U-12：通知开关与「消息免打扰」由服务端消费——写入前读取接收方偏好，
// 对应类型关闭或 muteNotify=true 时直接跳过，不再产生一条用户不想看/收的通知。
const shouldMute = async (uid, type) => {
  try {
    const row = await UserPref.findOne({ where: { user_id: uid }, attributes: ['data'] });
    if (!row || !row.data) return false;
    const prefs = JSON.parse(row.data) || {};
    if (prefs.stealthSettings && prefs.stealthSettings.muteNotify) return true;
    const settings = prefs.notifications;
    if (settings && typeof settings === 'object') {
      const key = typeof type === 'number' ? TYPE_KEYS[type] : type;
      if (key && settings[key] === false) return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const create = async (userId, type, title, content, data = {}) => {
  const uid = Number(userId);
  if (!uid) return null;
  try {
    if (await shouldMute(uid, type)) return null;
    return await Notification.create({
      userId: uid,
      type: typeof type === 'number' ? type : (TYPES[type] || TYPES.system),
      title: title || '',
      content: content || '',
      data,
      read: false,
      createTime: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    logger.error('[通知] 写入失败:', error.message);
    return null;
  }
};

const toItem = (row) => ({
  id: String(row._id),
  type: row.type,
  typeName: Object.keys(TYPES).find((key) => TYPES[key] === row.type) || 'system',
  title: row.title || '',
  content: row.content || '',
  data: row.data || {},
  isRead: !!row.read,
  createTime: Number(row.createTime) || 0
});

const list = async (userId, page = 1, pageSize = 20) => {
  const { page: safePage, pageSize: safePageSize, offset } = parseQuery({ page, pageSize });
  const where = { userId: Number(userId) };
  const [total, rows] = await Promise.all([
    Notification.countDocuments(where),
    Notification.find(where).sort({ createTime: -1 }).skip(offset).limit(safePageSize).lean()
  ]);
  return { total, list: rows.map(toItem), page: safePage, pageSize: safePageSize };
};

const unreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ userId: Number(userId), read: false });
  } catch (error) {
    logger.error('[通知] 未读统计失败:', error.message);
    return 0;
  }
};

const markRead = async (userId, id) => {
  await Notification.updateOne({ _id: id, userId: Number(userId) }, { $set: { read: true } });
  return true;
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ userId: Number(userId), read: false }, { $set: { read: true } });
  return true;
};

module.exports = { TYPES, create, list, unreadCount, markRead, markAllRead };
