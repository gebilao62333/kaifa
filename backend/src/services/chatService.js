const { ChatLog, User, VirtualUser, ChatSession, UserPref } = require('../models');

// 时间自动撤回上限（秒）：与前端设置页选项上限一致（5 分钟），超出按上限截断
const MAX_AUTO_RECALL_SECONDS = 300;
// 已读自动销毁上限（秒）：与前端档位上限一致（60 秒），超出的历史值按上限截断
const MAX_AUTO_DESTROY_SECONDS = 60;
const { getTimestamp, parseQuery } = require('../utils/helper');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const getChatList = async (userId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  // 会话存于 MySQL xn_chat_room 表（user_id <-> virtual_user_id），对端是虚拟用户
  const { count, rows } = await ChatSession.findAndCountAll({
    where: { user_id: userId },
    offset,
    limit,
    order: [['update_time', 'DESC']]
  });
  
  const list = await Promise.all(rows.map(async (session) => {
    // 白名单只查真实存在的列，避免模型定义与表结构不一致导致 Unknown column
    const peerUser = await VirtualUser.findByPk(session.virtual_user_id, {
      attributes: ['id', 'name', 'avatar', 'status']
    });
    
    return {
      id: session.id,
      fromId: session.virtual_user_id,
      toId: userId,
      nickname: peerUser?.name || peerUser?.nickname || '',
      avatar: peerUser?.avatar || '',
      content: session.last_message,
      sendTime: session.last_message_time,
      unreadCount: session.unread_count,
      level: 1,
      vip: 0
    };
  }));
  
  return {
    total: count,
    list
  };
};

const getChatMessages = async (userId, targetUserId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  // 预取双方头像（User.findByPk 返回 Promise，直接在 map 里取值会导致 avatar 永远为空）
  const [myUser, targetUser] = await Promise.all([
    User.findByPk(userId),
    (async () => {
      let t = await VirtualUser.findByPk(targetUserId, {
        attributes: ['id', 'name', 'avatar', 'status']
      });
      if (!t) t = await User.findByPk(targetUserId);
      return t;
    })()
  ]);
  const myAvatar = myUser?.avatar || '';
  const targetAvatar = targetUser?.avatar || '';
  
  const now = getTimestamp();
  const { count, rows } = await ChatLog.findAndCountAll({
    where: {
      is_del: 0,
      [Op.and]: [
        {
          [Op.or]: [
            { fromid: userId, toid: targetUserId },
            { fromid: targetUserId, toid: userId }
          ]
        },
        // 已读自动销毁：到期即不再返回（不依赖清理器是否已落库）
        { [Op.or]: [{ destroy_at: 0 }, { destroy_at: { [Op.gt]: now } }] }
      ]
    },
    offset,
    limit,
    order: [['time', 'DESC']]
  });
  
  const messages = rows.map(msg => {
    const expireAt = Number(msg.expire_at) || 0;
    // 到期未扫到的消息在读取侧也按已撤回处理：即使清理器还没跑到，也不会把原文下发
    const revoked = msg.is_revoked === 1 || (expireAt > 0 && expireAt <= now);
    return {
      id: msg.id,
      fromId: msg.fromid,
      toId: msg.toid,
      // 已撤回的消息不再下发原文与媒体地址：历史消息接口是刷新后唯一的真相来源
      content: revoked ? '' : msg.content,
      type: msg.type,
      mediaUrl: revoked ? null : msg.vod_url,
      duration: msg.sec,
      sendTime: msg.time,
      isSelf: msg.fromid === userId,
      avatar: msg.fromid === userId ? myAvatar : targetAvatar,
      isRevoked: revoked,
      expireAt: revoked ? 0 : expireAt,
      readAt: Number(msg.read_at) || 0,
      // 已到期（清理器未扫到）时直接置 0，客户端不必再挂销毁倒计时
      destroyAt: (Number(msg.destroy_at) || 0) > now ? Number(msg.destroy_at) : 0,
      isRead: msg.isread === 1
    };
  });
  
  return {
    total: count,
    list: messages.reverse()
  };
};

/**
 * 读取发送者的「时间自动撤回」秒数（0=关闭）。
 * 设置由 Settings 页写入 xn_user_pref.data.privacy.autoRecall（跨设备生效）；
 * 这里做容错与上限截断，任何异常都退回 0（不自动撤回），不能因为偏好表读失败而阻断发消息。
 */
const getAutoRecallSeconds = async (userId) => {
  try {
    const row = await UserPref.findOne({ where: { user_id: userId } });
    if (!row || !row.data) return 0;
    const pref = JSON.parse(row.data) || {};
    const seconds = Number(pref.privacy && pref.privacy.autoRecall);
    if (!Number.isFinite(seconds) || seconds <= 0) return 0;
    return Math.min(Math.floor(seconds), MAX_AUTO_RECALL_SECONDS);
  } catch (e) {
    logger.error('[聊天] 读取自动撤回设置失败:', e.message);
    return 0;
  }
};

/**
 * 读取「发送者」的已读自动销毁秒数（0=关闭）。
 * 语义：我发出的消息，被对方读了之后 N 秒销毁（双方都消失），期限由发送方决定。
 */
const getAutoDestroySeconds = async (userId) => {
  try {
    const row = await UserPref.findOne({ where: { user_id: userId } });
    if (!row || !row.data) return 0;
    const pref = JSON.parse(row.data) || {};
    const seconds = Number(pref.privacy && pref.privacy.autoDestroy);
    if (!Number.isFinite(seconds) || seconds <= 0) return 0;
    return Math.min(Math.floor(seconds), MAX_AUTO_DESTROY_SECONDS);
  } catch (e) {
    logger.error('[聊天] 读取自动销毁设置失败:', e.message);
    return 0;
  }
};

const sendMessage = async (fromId, toId, content, type = 0, mediaUrl, duration) => {
  const fromUser = await User.findByPk(fromId);
  // 对端优先按虚拟用户查询（聊天场景对端是 xn_virtual_user），兼容真实用户
  let toUser = await VirtualUser.findByPk(toId, {
    attributes: ['id', 'name', 'avatar', 'status']
  });
  if (!toUser) {
    toUser = await User.findByPk(toId);
  }
  
  if (!fromUser || !toUser) {
    throw new Error('用户不存在');
  }
  
  // status: 1=正常，其余=禁用
  if (fromUser.status !== 1) {
    throw new Error('您已被禁言');
  }
  
  const time = getTimestamp();
  // 时间自动撤回：撤回期限随消息落库（服务端事实），而不是只存在发送端内存里
  const autoRecall = await getAutoRecallSeconds(fromId);
  const expireAt = autoRecall > 0 ? time + autoRecall : 0;
  const message = await ChatLog.create({
    fromid: fromId,
    toid: toId,
    content,
    type,
    vod_url: mediaUrl || '',
    sec: duration || 0,
    time,
    isread: 0,
    is_del: 0,
    is_revoked: 0,
    expire_at: expireAt
  });

  // 媒体消息（图片/视频/语音）登记媒资，撤回时可级联清理底层存储
  if (mediaUrl && mediaUrl.trim() && [2, 3, 5].includes(type)) {
    try {
      const mediaAssetService = require('./mediaAssetService');
      const fileType = type === 2 ? 'image' : type === 3 ? 'video' : 'audio';
      await mediaAssetService.register({
        userId: fromId,
        url: mediaUrl,
        fileType,
        bizType: 'chat',
        bizId: message.id,
        storage: mediaUrl.includes('.myqcloud.com') ? 'cos' : 'local'
      });
    } catch (e) {
      logger.error('[聊天] 登记媒资失败:', e.message);
    }
  }
  
  // Update sender's session（MySQL xn_chat_room）
  let senderSession = await ChatSession.findOne({ where: { user_id: fromId, virtual_user_id: toId } });
  if (!senderSession) {
    await ChatSession.create({
      user_id: fromId,
      virtual_user_id: toId,
      last_message: content,
      last_message_time: time,
      unread_count: 0,
      create_time: time,
      update_time: time
    });
  } else {
    await senderSession.update({
      last_message: content,
      last_message_time: time,
      update_time: time
    });
  }
  
  // Update receiver's session（MySQL xn_chat_room）
  let receiverSession = await ChatSession.findOne({ where: { user_id: toId, virtual_user_id: fromId } });
  if (!receiverSession) {
    await ChatSession.create({
      user_id: toId,
      virtual_user_id: fromId,
      last_message: content,
      last_message_time: time,
      unread_count: 1,
      create_time: time,
      update_time: time
    });
  } else {
    await receiverSession.update({
      unread_count: (Number(receiverSession.unread_count) || 0) + 1,
      last_message: content,
      last_message_time: time,
      update_time: time
    });
  }
  
  return {
    messageId: message.id,
    sendTime: message.time,
    expireAt
  };
};

const revokeMessage = async (userId, messageId) => {
  const message = await ChatLog.findByPk(messageId);
  
  if (!message) {
    throw new Error('消息不存在');
  }
  
  if (message.fromid !== userId) {
    throw new Error('只能撤回自己发送的消息');
  }
  
  // 类型编号以「0文本 1语音 2图片 3视频 4位置 5语音 6礼物 7红包」为准；
  // 旧实现拦的是 3/4（视频/位置），反而放过了 6/7（礼物/红包），与注释意图相反
  if (message.type === 6 || message.type === 7) {
    throw new Error('礼物/红包消息不可撤回');
  }
  
  const now = getTimestamp();
  if (now - message.time > 120) {
    throw new Error('消息超过2分钟，无法撤回');
  }
  
  // 撤回即抹掉原文：只置 is_revoked 而保留 content，历史消息接口会把原文继续吐回前端
  const isMediaMessage = [2, 3, 5].includes(message.type);
  const hasMedia = isMediaMessage && !!(message.vod_url && message.vod_url.trim());
  const revokedFields = { is_revoked: 1, content: '' };
  if (hasMedia) revokedFields.vod_url = null;
  await message.update(revokedFields);

  // 撤回的图片/视频/语音消息，同步删除底层存储与媒资登记，避免孤儿文件
  if (hasMedia) {
    try {
      const { mediaAssetService } = require('../services');
      // 媒体消息存于 vod_url 字段；类型 2=图片 3=视频 5=语音
      await mediaAssetService.removeByBiz('chat', message.id);
    } catch (e) {
      logger.error('[聊天] 撤回清理媒资失败:', e.message);
    }
  }

  return true;
};

const markAsRead = async (userId, peerId) => {
  const now = getTimestamp();
  // 已读自动销毁期限由「发送方」(peerId) 决定；1v1 会话里未读消息全部来自同一发送方，只需查一次偏好
  const destroyDelay = await getAutoDestroySeconds(peerId);
  const destroyAt = destroyDelay > 0 ? now + destroyDelay : 0;

  const fields = { isread: 1, read_at: now };
  if (destroyAt > 0) fields.destroy_at = destroyAt;
  await ChatLog.update(fields, {
    where: {
      fromid: peerId,
      toid: userId,
      isread: 0
    }
  });

  await ChatSession.update(
    { unread_count: 0, update_time: now },
    { where: { user_id: userId, virtual_user_id: peerId } }
  );

  // destroyAt 交给两端做本地展示倒计时；事实仍由读接口过滤 + 清理器落库保证
  return { destroyAt };
};

/**
 * 把到期的时间自动撤回消息真正落库为「已撤回」：清空 content、媒体消息清 vod_url 并回收媒资。
 * 单次最多处理 SWEEP_BATCH 条，避免长事务；返回本次处理条数，便于脚本/测试单独调用。
 */
const SWEEP_BATCH = 200;
const sweepExpiredMessages = async () => {
  const now = getTimestamp();
  let rows = [];
  try {
    rows = await ChatLog.findAll({
      where: { is_revoked: 0, expire_at: { [Op.gt]: 0, [Op.lte]: now } },
      limit: SWEEP_BATCH
    });
  } catch (e) {
    logger.error('[聊天] 查询到期自动撤回消息失败:', e.message);
    return 0;
  }

  let affected = 0;
  for (const msg of rows) {
    try {
      const hasMedia = [2, 3, 5].includes(msg.type) && !!(msg.vod_url && String(msg.vod_url).trim());
      const fields = { is_revoked: 1, content: '' };
      if (hasMedia) fields.vod_url = null;
      await msg.update(fields);
      if (hasMedia) {
        try {
          const { mediaAssetService } = require('../services');
          await mediaAssetService.removeByBiz('chat', msg.id);
        } catch (e) {
          logger.error('[聊天] 自动撤回清理媒资失败:', e.message);
        }
      }
      affected++;
    } catch (e) {
      logger.error('[聊天] 自动撤回落库失败:', e.message);
    }
  }
  if (affected > 0) {
    logger.info(`聊天自动撤回：${affected} 条到期消息已标记为已撤回`);
  }
  return affected;
};

/**
 * 已读自动销毁的落库清理：把到期消息清空内容并标记 is_del=1。
 * 同时把会话列表里指向该消息的 last_message 换成占位文案，避免列表继续露出原文。
 */
const DESTROYED_PLACEHOLDER = '[消息已销毁]';
const DESTROY_BATCH = 200;

const markSessionLastMessageDestroyed = async (msg) => {
  const pairs = [[msg.fromid, msg.toid], [msg.toid, msg.fromid]];
  for (const [uid, peer] of pairs) {
    try {
      await ChatSession.update(
        { last_message: DESTROYED_PLACEHOLDER },
        { where: { user_id: uid, virtual_user_id: peer, last_message_time: msg.time } }
      );
    } catch (e) {
      logger.error('[聊天] 会话列表占位更新失败:', e.message);
    }
  }
};

const sweepDestroyedMessages = async () => {
  const now = getTimestamp();
  let rows = [];
  try {
    rows = await ChatLog.findAll({
      where: { is_del: 0, destroy_at: { [Op.gt]: 0, [Op.lte]: now } },
      limit: DESTROY_BATCH
    });
  } catch (e) {
    logger.error('[聊天] 查询到期已读销毁消息失败:', e.message);
    return 0;
  }

  let affected = 0;
  for (const msg of rows) {
    try {
      const hasMedia = [2, 3, 5].includes(msg.type) && !!(msg.vod_url && String(msg.vod_url).trim());
      const fields = { is_del: 1, destroyed_at: now, content: '' };
      if (hasMedia) fields.vod_url = null;
      await msg.update(fields);
      if (hasMedia) {
        try {
          const { mediaAssetService } = require('../services');
          await mediaAssetService.removeByBiz('chat', msg.id);
        } catch (e) {
          logger.error('[聊天] 已读销毁清理媒资失败:', e.message);
        }
      }
      await markSessionLastMessageDestroyed(msg);
      affected++;
    } catch (e) {
      logger.error('[聊天] 已读销毁落库失败:', e.message);
    }
  }
  if (affected > 0) {
    logger.info(`聊天已读销毁：${affected} 条到期消息已清除内容`);
  }
  return affected;
};

module.exports = {
  getChatList,
  getChatMessages,
  sendMessage,
  revokeMessage,
  sweepExpiredMessages,
  sweepDestroyedMessages,
  getAutoRecallSeconds,
  getAutoDestroySeconds,
  markAsRead
};
