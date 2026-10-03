const { trtcService, callBillingService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

// TRTC 未配置（缺少 TRTC_APP_ID / TRTC_SECRET_KEY）返回 200 + configured:false。
//
// 语义说明：这不是「服务故障/过载」，而是「该通道未开通」，因此不应使用 503——
// 503 会被所有按「5xx=故障」规则的监控、健康检查、冒烟测试误判为异常。
// 前端 callService.isTRTCAvailable / trtcRoomService.join 均按 appId、userSig 是否存在判定，
// 行为不变：仍然自动降级到 WebRTC 通道。
const notConfiguredPayload = (userId) => ({
  configured: false,
  appId: null,
  sdkAppId: null,
  userSig: null,
  userId: String(userId || '')
});

const getAuth = async (req, res) => {
  try {
    const result = trtcService.generateUserSig(req.userId);

    if (!result) {
      return response.success(res, notConfiguredPayload(req.userId), 'TRTC未配置，请使用 WebRTC 通道');
    }

    response.success(res, Object.assign({ configured: true }, result));
  } catch (error) {
    logger.error('获取TRTC鉴权错误:', error);
    if (String(error.message).includes('未配置')) {
      return response.success(res, notConfiguredPayload(req.userId), 'TRTC未配置，请使用 WebRTC 通道');
    }
    response.error(res, error.message);
  }
};

const startCall = async (req, res) => {
  try {
    const { calleeId, callType, isCompanionCall, orderId } = req.body;
    
    if (!calleeId) {
      return response.badRequest(res, '被叫ID不能为空');
    }
    
    const result = await callBillingService.startCall(
      req.userId,
      parseInt(calleeId),
      parseInt(callType) || 1,
      !!isCompanionCall,
      orderId ? parseInt(orderId) : 0
    );
    response.success(res, result);
  } catch (error) {
    logger.error('发起通话错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const cancelCall = async (req, res) => {
  try {
    const { callId } = req.body;
    
    if (!callId) {
      return response.badRequest(res, '通话ID不能为空');
    }
    
    await callBillingService.cancelCall(req.userId, parseInt(callId));
    response.success(res, {}, '已取消通话');
  } catch (error) {
    logger.error('取消通话错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const rejectCall = async (req, res) => {
  try {
    const { callId } = req.body;
    
    if (!callId) {
      return response.badRequest(res, '通话ID不能为空');
    }
    
    await callBillingService.rejectCall(req.userId, parseInt(callId));
    response.success(res, {}, '已拒绝通话');
  } catch (error) {
    logger.error('拒绝通话错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const acceptCall = async (req, res) => {
  try {
    const { callId } = req.body;
    
    if (!callId) {
      return response.badRequest(res, '通话ID不能为空');
    }
    
    await callBillingService.acceptCall(req.userId, parseInt(callId));
    response.success(res, {}, '已接听');
  } catch (error) {
    logger.error('接听通话错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const endCall = async (req, res) => {
  try {
    const { callId } = req.body;
    
    if (!callId) {
      return response.badRequest(res, '通话ID不能为空');
    }
    
    const result = await callBillingService.endCall(req.userId, parseInt(callId));
    response.success(res, result, '通话已结束');
  } catch (error) {
    logger.error('结束通话错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getCallHistory = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await callBillingService.getCallHistory(
      req.userId,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取通话记录错误:', error);
    response.error(res, error.message);
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomType = 'video' } = req.body;
    const result = await trtcService.createRoom(req.userId, roomType);
    response.success(res, result, '房间创建成功');
  } catch (error) {
    logger.error('创建房间错误:', error);
    response.error(res, error.message);
  }
};

const enterRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return response.badRequest(res, '房间ID不能为空');
    }
    
    const result = await trtcService.enterRoom(req.userId, roomId);
    response.success(res, result, '进入房间成功');
  } catch (error) {
    logger.error('进入房间错误:', error);
    response.error(res, error.message);
  }
};

const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return response.badRequest(res, '房间ID不能为空');
    }
    
    const result = await trtcService.leaveRoom(req.userId, roomId);
    response.success(res, result, '离开房间成功');
  } catch (error) {
    logger.error('离开房间错误:', error);
    response.error(res, error.message);
  }
};

const getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return response.badRequest(res, '房间ID不能为空');
    }
    
    const result = await trtcService.getRoomInfo(roomId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取房间信息错误:', error);
    response.error(res, error.message);
  }
};

const startBilling = async (req, res) => {
  try {
    const { roomId, callType } = req.body;
    
    if (!roomId) {
      return response.badRequest(res, '房间ID不能为空');
    }
    
    const result = await trtcService.startBilling(req.userId, roomId, callType);
    response.success(res, result, '开始计费');
  } catch (error) {
    logger.error('开始计费错误:', error);
    response.error(res, error.message);
  }
};

const endBilling = async (req, res) => {
  try {
    const { billingId } = req.body;
    
    if (!billingId) {
      return response.badRequest(res, '计费ID不能为空');
    }
    
    const result = await trtcService.endBilling(billingId);
    response.success(res, result, '计费结束');
  } catch (error) {
    logger.error('结束计费错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getAuth,
  startCall,
  cancelCall,
  rejectCall,
  acceptCall,
  endCall,
  getCallHistory,
  createRoom,
  enterRoom,
  leaveRoom,
  getRoomInfo,
  startBilling,
  endBilling
};
