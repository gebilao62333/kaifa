const crypto = require('crypto');
const config = require('../config');

const generateUserSig = (userId) => {
  if (!config.trtc.appId || !config.trtc.secretKey) {
    return null;
  }
  
  const appId = parseInt(config.trtc.appId);
  const userIdStr = String(userId);
  const expireTime = Math.floor(Date.now() / 1000) + 86400;
  const currentTime = Math.floor(Date.now() / 1000);
  
  const json = JSON.stringify({
    "TLS.appIdAtThird": appId,
    "TLS.userId": userIdStr,
    "TLS.expireTime": expireTime,
    "TLS.appId": appId,
    "TLS.currentTime": currentTime
  });
  
  const base64Str = Buffer.from(json).toString('base64');
  const signature = crypto.createHmac('sha256', config.trtc.secretKey)
    .update(base64Str)
    .digest('base64');
  
  return {
    userId: userIdStr,
    userSig: base64Str + signature,
    appId,
    expireTime
  };
};

const generateRoomId = (userId1, userId2) => {
  const sorted = [userId1, userId2].sort((a, b) => a - b);
  return `${sorted[0]}-${sorted[1]}`;
};

const generateRoomSig = (roomId, userId) => {
  if (!config.trtc.appId || !config.trtc.secretKey) {
    return null;
  }
  
  const appId = parseInt(config.trtc.appId);
  const userIdStr = String(userId);
  const expireTime = Math.floor(Date.now() / 1000) + 3600;
  
  const json = JSON.stringify({
    "TLS.ver": "2.0",
    "TLS.identifier": userIdStr,
    "TLS.sdkappid": appId,
    "TLS.time": Math.floor(Date.now() / 1000),
    "TLS.expire": expireTime,
    "TLS.roomid": parseInt(roomId) || 0
  });
  
  const base64Str = Buffer.from(json).toString('base64');
  const signature = crypto.createHmac('sha256', config.trtc.secretKey)
    .update(base64Str)
    .digest('base64');
  
  return base64Str + signature;
};

const verifyUserSig = (userSig) => {
  if (!userSig || userSig.length < 20) {
    return false;
  }
  
  try {
    const base64Part = userSig.substring(0, userSig.length - 44);
    const sigPart = userSig.substring(userSig.length - 44);
    
    const decoded = Buffer.from(base64Part, 'base64').toString('utf8');
    const data = JSON.parse(decoded);
    
    if (!data['TLS.appId'] || !data['TLS.userId']) {
      return false;
    }
    
    const expectedSig = crypto.createHmac('sha256', config.trtc.secretKey)
      .update(base64Part)
      .digest('base64');
    
    return sigPart === expectedSig;
  } catch (error) {
    console.error('[TRTC] 验证UserSig失败:', error);
    return false;
  }
};

const getMeetingInfo = (roomId) => {
  return {
    roomId,
    appId: config.trtc.appId,
    sdkAppId: config.trtc.appId,
    serverTime: Math.floor(Date.now() / 1000)
  };
};

const createRoom = async (userId, roomType = 'video') => {
  const roomId = Math.floor(Math.random() * 900000) + 100000;
  
  const roomInfo = {
    roomId,
    creatorId: userId,
    roomType,
    createTime: Math.floor(Date.now() / 1000),
    status: 'waiting',
    participants: [userId]
  };
  
  return roomInfo;
};

const enterRoom = async (userId, roomId) => {
  const roomSig = generateRoomSig(roomId, userId);
  
  return {
    roomId,
    userId,
    userSig: generateUserSig(userId),
    roomSig,
    enterTime: Math.floor(Date.now() / 1000)
  };
};

const leaveRoom = async (userId, roomId) => {
  return {
    roomId,
    userId,
    leaveTime: Math.floor(Date.now() / 1000),
    success: true
  };
};

const getRoomInfo = async (roomId) => {
  return {
    roomId,
    appId: config.trtc.appId,
    sdkAppId: config.trtc.appId,
    status: 'active',
    createTime: Math.floor(Date.now() / 1000) - 3600
  };
};

const startBilling = async (userId, roomId, callType) => {
  return {
    billingId: Math.floor(Math.random() * 1000000),
    userId,
    roomId,
    callType,
    startTime: Math.floor(Date.now() / 1000),
    status: 'active'
  };
};

const endBilling = async (billingId) => {
  const endTime = Math.floor(Date.now() / 1000);
  const duration = Math.floor(Math.random() * 600) + 60;
  
  return {
    billingId,
    endTime,
    duration,
    cost: duration * 0.01,
    status: 'completed'
  };
};

module.exports = {
  generateUserSig,
  generateRoomId,
  generateRoomSig,
  verifyUserSig,
  getMeetingInfo,
  createRoom,
  enterRoom,
  leaveRoom,
  getRoomInfo,
  startBilling,
  endBilling
};