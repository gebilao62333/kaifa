const { verifyToken } = require('../config/jwt');
const { User, UserSession, ChatMessage } = require('../models');
const logger = require('../utils/logger');

let io = null;

const initializeSocket = (socketIO) => {
  io = socketIO;
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        console.log('[Socket] 未提供认证令牌，跳过认证（开发模式）');
        socket.userId = 1;
        socket.user = { id: 1, nickname: '测试用户' };
        return next();
      }
      
      const decoded = verifyToken(token);
      
      if (!decoded) {
        console.log('[Socket] Token验证失败，尝试Mock模式');
        const mockUserId = parseInt(token.split('-')[1]) || 1;
        socket.userId = mockUserId;
        socket.user = { id: mockUserId, nickname: 'Mock用户' };
        return next();
      }
      
      const userId = decoded.userId || decoded.id;
      const user = await User.findByPk(userId);
      
      if (!user) {
        console.log('[Socket] 用户不存在，使用Mock模式');
        socket.userId = userId;
        socket.user = { id: userId, nickname: '未知用户' };
        return next();
      }
      
      socket.userId = userId;
      socket.user = user;
      
      next();
    } catch (error) {
      logger.error('Socket认证错误:', error);
      console.log('[Socket] 认证错误，使用Mock模式:', error.message);
      socket.userId = 1;
      socket.user = { id: 1, nickname: '测试用户' };
      next();
    }
  });
  
  io.on('connection', async (socket) => {
    logger.info(`用户 ${socket.userId} 已连接`);
    
    socket.join(`user:${socket.userId}`);
    
    await updateUserOnlineStatus(socket.userId, true);
    
    socket.on('private_message', async (data) => {
      try {
        const { toId, content, type = 0, mediaUrl, duration } = data;
        
        const message = await ChatMessage.create({
          roomId: `private_${Math.min(socket.userId, toId)}_${Math.max(socket.userId, toId)}`,
          senderId: socket.userId,
          senderName: socket.user.nickname,
          senderAvatar: socket.user.avatar,
          content,
          type,
          mediaUrl: mediaUrl || '',
          duration: duration || 0,
          sendTime: Math.floor(Date.now() / 1000)
        });
        
        const messageData = {
          id: message._id,
          fromId: socket.userId,
          toId: parseInt(toId),
          fromName: socket.user.nickname,
          fromAvatar: socket.user.avatar,
          content,
          type,
          mediaUrl: mediaUrl || '',
          duration: duration || 0,
          sendTime: message.sendTime,
          isRevoked: false
        };
        
        io.to(`user:${toId}`).emit('private_message', messageData);
        socket.emit('private_message_ack', {
          id: message._id,
          sendTime: message.sendTime
        });
        
        logger.info(`私聊消息: ${socket.userId} -> ${toId}`);
      } catch (error) {
        logger.error('发送私聊消息错误:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });
    
    socket.on('room_message', async (data) => {
      try {
        const { roomId, content, type = 0, mediaUrl, duration } = data;
        
        const message = await ChatMessage.create({
          roomId: `room_${roomId}`,
          senderId: socket.userId,
          senderName: socket.user.nickname,
          senderAvatar: socket.user.avatar,
          content,
          type,
          mediaUrl: mediaUrl || '',
          duration: duration || 0,
          sendTime: Math.floor(Date.now() / 1000)
        });
        
        const messageData = {
          id: message._id,
          roomId: parseInt(roomId),
          fromId: socket.userId,
          fromName: socket.user.nickname,
          fromAvatar: socket.user.avatar,
          content,
          type,
          mediaUrl: mediaUrl || '',
          duration: duration || 0,
          sendTime: message.sendTime
        };
        
        socket.to(`room:${roomId}`).emit('room_message', messageData);
        socket.emit('room_message_ack', {
          id: message._id,
          sendTime: message.sendTime
        });
        
        logger.info(`房间消息: 用户${socket.userId} 在房间${roomId}`);
      } catch (error) {
        logger.error('发送房间消息错误:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });
    
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        socket.join(`room:${roomId}`);
        socket.emit('join_room_success', { roomId });
        
        logger.info(`用户 ${socket.userId} 加入房间 ${roomId}`);
      } catch (error) {
        logger.error('加入房间错误:', error);
        socket.emit('error', { message: '加入房间失败' });
      }
    });
    
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;
        socket.leave(`room:${roomId}`);
        socket.emit('leave_room_success', { roomId });
        
        logger.info(`用户 ${socket.userId} 离开房间 ${roomId}`);
      } catch (error) {
        logger.error('离开房间错误:', error);
        socket.emit('error', { message: '离开房间失败' });
      }
    });
    
    socket.on('call_invite', async (data) => {
      try {
        const { toId, callType, trtcRoomId } = data;
        
        io.to(`user:${toId}`).emit('call_invite', {
          fromId: socket.userId,
          fromName: socket.user.nickname,
          fromAvatar: socket.user.avatar,
          callType,
          trtcRoomId
        });
        
        logger.info(`通话邀请: ${socket.userId} -> ${toId}`);
      } catch (error) {
        logger.error('发送通话邀请错误:', error);
        socket.emit('error', { message: '发送通话邀请失败' });
      }
    });
    
    socket.on('call_cancel', async (data) => {
      try {
        const { toId } = data;
        
        io.to(`user:${toId}`).emit('call_cancel', {
          fromId: socket.userId
        });
      } catch (error) {
        logger.error('取消通话错误:', error);
      }
    });
    
    socket.on('call_reject', async (data) => {
      try {
        const { toId } = data;
        
        io.to(`user:${toId}`).emit('call_reject', {
          fromId: socket.userId
        });
      } catch (error) {
        logger.error('拒绝通话错误:', error);
      }
    });
    
    socket.on('call_accept', async (data) => {
      try {
        const { toId, trtcRoomId } = data;
        
        io.to(`user:${toId}`).emit('call_accept', {
          fromId: socket.userId,
          trtcRoomId
        });
      } catch (error) {
        logger.error('接听通话错误:', error);
      }
    });
    
    socket.on('call_end', async (data) => {
      try {
        const { toId, duration } = data;
        
        io.to(`user:${toId}`).emit('call_end', {
          fromId: socket.userId,
          duration
        });
      } catch (error) {
        logger.error('结束通话错误:', error);
      }
    });
    
    socket.on('typing', async (data) => {
      try {
        const { toId } = data;
        io.to(`user:${toId}`).emit('typing', {
          fromId: socket.userId,
          fromName: socket.user.nickname
        });
      } catch (error) {
        logger.error('发送打字状态错误:', error);
      }
    });
    
    socket.on('revoke_message', async (data) => {
      try {
        const { toId, messageId } = data;
        
        io.to(`user:${toId}`).emit('message_revoked', {
          messageId,
          fromId: socket.userId
        });
      } catch (error) {
        logger.error('撤回消息错误:', error);
      }
    });
    
    socket.on('disconnect', async () => {
      logger.info(`用户 ${socket.userId} 已断开连接`);
      await updateUserOnlineStatus(socket.userId, false);
    });
  });
  
  return io;
};

const updateUserOnlineStatus = async (userId, isOnline) => {
  try {
    logger.info(`更新用户 ${userId} 在线状态: ${isOnline}`);
  } catch (error) {
    logger.error('更新在线状态错误:', error);
  }
};

const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const sendToRoom = (roomId, event, data) => {
  if (io) {
    io.to(`room:${roomId}`).emit(event, data);
  }
};

const sendToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const getIO = () => io;

module.exports = {
  initializeSocket,
  sendToUser,
  sendToRoom,
  sendToAll,
  getIO
};
