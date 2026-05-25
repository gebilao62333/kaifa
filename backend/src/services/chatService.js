const { ChatLog, ChatRoom, User, UserSession, ChatMessage } = require('../models');
const { getTimestamp, parseQuery } = require('../utils/helper');
const { Op } = require('sequelize');

const getChatList = async (userId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const sessions = await UserSession.findAndCountAll({
    where: { userId },
    offset,
    limit,
    order: [['updateTime', 'DESC']]
  });
  
  const list = await Promise.all(sessions.rows.map(async (session) => {
    const peerUser = await User.findByPk(session.peerId);
    
    return {
      id: session.id,
      fromId: session.peerId,
      toId: userId,
      nickname: session.peerName || peerUser?.nickname || '',
      avatar: session.peerAvatar || peerUser?.avatar || '',
      content: session.lastMessage,
      sendTime: session.lastMessageTime,
      unreadCount: session.unreadCount,
      level: peerUser?.lv || 1,
      vip: peerUser?.vip || 0
    };
  }));
  
  return {
    total: sessions.count,
    list
  };
};

const getChatMessages = async (userId, targetUserId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
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
    avatar: (msg.fromid === userId ? 
      (User.findByPk(userId))?.avatar : 
      (User.findByPk(targetUserId))?.avatar) || '',
    isRevoked: msg.is_revoked === 1,
    revokeTime: msg.revoke_time
  }));
  
  return {
    total: count,
    list: messages.reverse()
  };
};

const sendMessage = async (fromId, toId, content, type = 0, mediaUrl, duration) => {
  const fromUser = await User.findByPk(fromId);
  const toUser = await User.findByPk(toId);
  
  if (!fromUser || !toUser) {
    throw new Error('用户不存在');
  }
  
  if (fromUser.status === 1) {
    throw new Error('您已被禁言');
  }
  
  const message = await ChatLog.create({
    fromid: fromId,
    fromname: fromUser.nickname,
    toid: toId,
    toname: toUser.nickname,
    content,
    type,
    vod_url: mediaUrl || '',
    sec: duration || 0,
    time: getTimestamp(),
    isread: 0,
    is_del: 0,
    is_revoked: 0
  });
  
  await UserSession.findOrCreate({
    where: { userId: fromId, peerId: toId },
    defaults: {
      peerName: toUser.nickname,
      peerAvatar: toUser.avatar,
      lastMessage: content,
      lastMessageType: type,
      lastMessageTime: getTimestamp(),
      unreadCount: 0
    }
  });
  
  await UserSession.update({
    lastMessage: content,
    lastMessageType: type,
    lastMessageTime: getTimestamp()
  }, {
    where: { userId: toId, peerId: fromId }
  });
  
  const [session] = await UserSession.findOrCreate({
    where: { userId: toId, peerId: fromId },
    defaults: {
      peerName: fromUser.nickname,
      peerAvatar: fromUser.avatar,
      lastMessage: content,
      lastMessageType: type,
      lastMessageTime: getTimestamp(),
      unreadCount: 1
    }
  });
  
  if (session) {
    await session.increment('unreadCount');
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
    is_revoked: 1,
    revoke_time: now
  });
  
  return true;
};

const createRoom = async (userId, title, subtitle, background, roomType) => {
  const room = await ChatRoom.create({
    title,
    title_sub: subtitle || '',
    image_bg: background || '',
    manage_id: userId,
    type: roomType || 0,
    status: 0,
    open: 0,
    create_time: getTimestamp()
  });
  
  return {
    roomId: room.id
  };
};

const getRoomInfo = async (roomId) => {
  const room = await ChatRoom.findByPk(roomId);
  
  if (!room) {
    throw new Error('聊天室不存在');
  }
  
  return {
    roomId: room.id,
    title: room.title,
    subtitle: room.title_sub,
    coverImage: room.image,
    backgroundImage: room.image_bg,
    managerId: room.manage_id,
    roomType: room.type,
    isOpen: room.open === 1,
    createTime: room.create_time
  };
};

const getRooms = async (page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const { count, rows } = await ChatRoom.findAndCountAll({
    where: {
      status: 1,
      open: 1
    },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  return {
    total: count,
    list: rows.map(room => ({
      roomId: room.id,
      title: room.title,
      subtitle: room.title_sub,
      coverImage: room.image,
      backgroundImage: room.image_bg,
      managerId: room.manage_id,
      roomType: room.type
    }))
  };
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

  await UserSession.update(
    { unreadCount: 0 },
    {
      where: {
        userId: userId,
        peerId: peerId
      }
    }
  );

  return true;
};

module.exports = {
  getChatList,
  getChatMessages,
  sendMessage,
  revokeMessage,
  markAsRead,
  createRoom,
  getRoomInfo,
  getRooms
};
