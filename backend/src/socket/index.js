const { verifyToken } = require('../config/jwt');
const { User, UserSession } = require('../models');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const config = require('../config');
const { Redis } = require('ioredis');

let io = null;

/**
 * 配置 Socket.IO Redis 适配器，使多 backend 副本间的实时事件可跨实例广播（横向扩展）。
 * Redis 不可用时防御式降级：保留默认内存 adapter，单实例照常工作。
 */
function setupRedisAdapter(socketIo) {
  if (config.useMockDb) {
    logger.info('[Socket] Mock 模式：跳过 Redis adapter');
    return;
  }
  try {
    // autoConnect：ioredis 自行连接并按 retryStrategy 重试，
    // 避免启动早期瞬时抖动导致 connect() 误 reject 而永久降级为内存 adapter。
    const opts = {
      host: config.db.redis.host,
      port: config.db.redis.port,
      password: config.db.redis.password || undefined,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => Math.min(times * 200, 2000)
    };
    const pubClient = new Redis(opts);
    const subClient = pubClient.duplicate();
    const { createAdapter } = require('@socket.io/redis-adapter');
    socketIo.adapter(createAdapter(pubClient, subClient));

    let warned = false;
    pubClient.on('ready', () => {
      logger.info('[Socket] Redis adapter 已启用（支持多实例横向扩展）');
    });
    pubClient.on('error', (e) => {
      if (!warned) {
        warned = true;
        logger.warn('[Socket] Redis adapter 连接异常，正在自动重试:', (e && (e.stack || e.message)) || e);
      }
    });
  } catch (e) {
    logger.warn('[Socket] 未启用 Redis adapter，使用默认内存 adapter（单实例）:', (e && (e.stack || e.message)) || e);
  }
}

// 用户会话已迁移至 MongoDB（UserSession 模型），支持多实例横向扩展

const initializeSocket = (socketIO) => {
  io = socketIO;

  // 横向扩展：Redis adapter 让多副本间的 Socket 事件（私聊/通话/房间广播）跨实例同步
  setupRedisAdapter(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      // Socket 承载私聊、通话与信令，必须严格鉴权，禁止任何匿名/Mock 放行
      if (!token) {
        logger.warn('[Socket] 拒绝连接：未提供认证令牌');
        return next(new Error('UNAUTHORIZED'));
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        logger.warn('[Socket] 拒绝连接：令牌无效或已过期');
        return next(new Error('UNAUTHORIZED'));
      }

      const userId = decoded.userId || decoded.id;
      if (!userId) {
        logger.warn('[Socket] 拒绝连接：令牌缺少用户标识');
        return next(new Error('UNAUTHORIZED'));
      }

      const user = await User.findByPk(userId);

      if (!user) {
        logger.warn(`[Socket] 拒绝连接：用户不存在 userId=${userId}`);
        return next(new Error('UNAUTHORIZED'));
      }

      socket.userId = userId;
      socket.user = user;

      next();
    } catch (error) {
      logger.error('Socket认证错误:', error);
      next(new Error('UNAUTHORIZED'));
    }
  });
  
  io.on('connection', async (socket) => {
    logger.info(`用户 ${socket.userId} 已连接`);
    
    socket.join(`user:${socket.userId}`);
    
    const device = socket.handshake.headers['user-agent'] || '';
    await updateUserOnlineStatus(socket.userId, true, socket.id, device);
    
    socket.on('private_message', async (data) => {
      try {
        const { toId, content, type = 0, mediaUrl, duration } = data;
        
        // 复用 chatService.sendMessage：落 MySQL xn_chat_log + 更新双端会话与未读数
        const result = await chatService.sendMessage(
          socket.userId,
          parseInt(toId),
          content,
          type,
          mediaUrl || '',
          duration || 0
        );
        
        const messageData = {
          id: result.messageId,
          fromId: socket.userId,
          toId: parseInt(toId),
          fromName: socket.user.nickname,
          fromAvatar: socket.user.avatar,
          content,
          type,
          mediaUrl: mediaUrl || '',
          duration: duration || 0,
          sendTime: result.sendTime,
          isRevoked: false
        };
        
        io.to(`user:${toId}`).emit('private_message', messageData);
        socket.emit('private_message_ack', {
          id: result.messageId,
          sendTime: result.sendTime
        });
        
        logger.info(`私聊消息: ${socket.userId} -> ${toId}`);
      } catch (error) {
        logger.error('发送私聊消息错误:', error);
        socket.emit('error', { message: error.message || '发送消息失败' });
      }
    });
    
    socket.on('call_invite', async (data) => {
      try {
        const { toId, callType, trtcRoomId, callId, useWebRTC } = data;
        
        io.to(`user:${toId}`).emit('call_invite', {
          fromId: socket.userId,
          fromName: socket.user.nickname,
          fromAvatar: socket.user.avatar,
          callType,
          trtcRoomId: trtcRoomId || '',
          callId: callId || 0,
          useWebRTC: !!useWebRTC
        });
        
        logger.info(`通话邀请: ${socket.userId} -> ${toId} (TRTC:${!useWebRTC}, WebRTC:${!!useWebRTC})`);
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
    
    // ============ WebRTC 信令 ============
    socket.on('webrtc_offer', async (data) => {
      try {
        const { toId, sdp } = data;
        io.to(`user:${toId}`).emit('webrtc_offer', {
          fromId: socket.userId,
          sdp
        });
        logger.info(`WebRTC Offer: ${socket.userId} -> ${toId}`);
      } catch (error) {
        logger.error('WebRTC Offer错误:', error);
      }
    });
    
    socket.on('webrtc_answer', async (data) => {
      try {
        const { toId, sdp } = data;
        io.to(`user:${toId}`).emit('webrtc_answer', {
          fromId: socket.userId,
          sdp
        });
        logger.info(`WebRTC Answer: ${socket.userId} -> ${toId}`);
      } catch (error) {
        logger.error('WebRTC Answer错误:', error);
      }
    });
    
    socket.on('webrtc_ice_candidate', async (data) => {
      try {
        const { toId, candidate } = data;
        io.to(`user:${toId}`).emit('webrtc_ice_candidate', {
          fromId: socket.userId,
          candidate
        });
      } catch (error) {
        logger.error('WebRTC ICE错误:', error);
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

    // P2P 热内容取回流：请求方 -> 拥有方 的取数请求（如头像/缩略图）
    socket.on('p2p_fetch_request', async (data) => {
      try {
        const { toId, requestId, url, type } = data;
        io.to(`user:${toId}`).emit('p2p_fetch_request', {
          fromId: socket.userId,
          requestId,
          url,
          type
        });
      } catch (error) {
        logger.error('P2P取数请求错误:', error);
      }
    });

    // 拥有方 -> 请求方 的取数响应（回传经DataChannel转发的字节或回退签名URL）
    socket.on('p2p_fetch_response', async (data) => {
      try {
        const { toId, requestId, payload, fallbackUrl } = data;
        io.to(`user:${toId}`).emit('p2p_fetch_response', {
          fromId: socket.userId,
          requestId,
          payload,
          fallbackUrl
        });
      } catch (error) {
        logger.error('P2P取数响应错误:', error);
      }
    });

    // P2P DataChannel 建连信令转发（offer/answer/ice），复用与WebRTC一致的转发模式
    socket.on('p2p_offer', async (data) => {
      try {
        const { toId, requestId, offer, url, type } = data;
        io.to(`user:${toId}`).emit('p2p_offer', {
          fromId: socket.userId,
          requestId,
          offer,
          url,
          type
        });
      } catch (error) {
        logger.error('P2P offer转发错误:', error);
      }
    });

    socket.on('p2p_answer', async (data) => {
      try {
        const { toId, requestId, answer } = data;
        io.to(`user:${toId}`).emit('p2p_answer', {
          fromId: socket.userId,
          requestId,
          answer
        });
      } catch (error) {
        logger.error('P2P answer转发错误:', error);
      }
    });

    socket.on('p2p_ice_candidate', async (data) => {
      try {
        const { toId, requestId, candidate } = data;
        io.to(`user:${toId}`).emit('p2p_ice_candidate', {
          fromId: socket.userId,
          requestId,
          candidate
        });
      } catch (error) {
        logger.error('P2P ICE转发错误:', error);
      }
    });
  });

  return io;
};

const updateUserOnlineStatus = async (userId, isOnline, socketId, device) => {
  try {
    if (isOnline) {
      await UserSession.findOneAndUpdate(
        { userId },
        { userId, socketId, device, lastActiveTime: Date.now() },
        { upsert: true, new: true }
      );
    } else {
      await UserSession.deleteOne({ userId });
    }
    logger.info(`更新用户 ${userId} 在线状态: ${isOnline}`);
  } catch (error) {
    logger.error('更新在线状态错误:', error);
  }
};

const isUserOnline = async (userId) => {
  const session = await UserSession.findOne({ userId });
  return !!session;
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
  getIO,
  isUserOnline
};
