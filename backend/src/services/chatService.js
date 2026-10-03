const { ChatLog, User, VirtualUser, ChatSession } = require('../models');
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
  
  const { count, rows } = await ChatLog.findAndCountAll({
    where: {
      [Op.or]: [
        { fromid: userId, toid: targetUserId },
        { fromid: targetUserId, toid: userId }
      ],
      is_del: 0
    },
    offset,
    limit,
    order: [['time', 'DESC']]
  });
  
  const messages = rows.map(msg => ({
    id: msg.id,
    fromId: msg.fromid,
    toId: msg.toid,
    content: msg.content,
    type: msg.type,
    mediaUrl: msg.vod_url,
    duration: msg.sec,
    sendTime: msg.time,
    isSelf: msg.fromid === userId,
    avatar: msg.fromid === userId ? myAvatar : targetAvatar,
    isRevoked: msg.is_revoked === 1,
    isRead: msg.isread === 1
  }));
  
  return {
    total: count,
    list: messages.reverse()
  };
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
    is_revoked: 0
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
    sendTime: message.time
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
  
  if (message.type === 3 || message.type === 4) {
    throw new Error('礼物/红包消息不可撤回');
  }
  
  const now = getTimestamp();
  if (now - message.time > 120) {
    throw new Error('消息超过2分钟，无法撤回');
  }
  
  await message.update({
    is_revoked: 1
  });

  // 撤回的图片/视频/语音消息，同步删除底层存储与媒资登记，避免孤儿文件
  try {
    const { mediaAssetService } = require('../services');
    // 媒体消息存于 vod_url 字段；类型 2=图片 3=视频 5=语音
    if (message.vod_url && message.vod_url.trim() && [2, 3, 5].includes(message.type)) {
      await mediaAssetService.removeByBiz('chat', message.id);
    }
  } catch (e) {
    logger.error('[聊天] 撤回清理媒资失败:', e.message);
  }

  return true;
};

const markAsRead = async (userId, peerId) => {
  await ChatLog.update(
    { isread: 1 },
    {
      where: {
        fromid: peerId,
        toid: userId,
        isread: 0
      }
    }
  );

  await ChatSession.update(
    { unread_count: 0, update_time: getTimestamp() },
    { where: { user_id: userId, virtual_user_id: peerId } }
  );

  return true;
};

module.exports = {
  getChatList,
  getChatMessages,
  sendMessage,
  revokeMessage,
  markAsRead
};
