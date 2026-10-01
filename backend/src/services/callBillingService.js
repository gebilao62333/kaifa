const { CallRecord, CallBilling, User } = require('../models');
const { getTimestamp, generateCallNo, parseQuery } = require('../utils/helper');
const sequelize = require('../config/mysql');
const { Op } = require('sequelize');

const startCall = async (callerId, calleeId, callType, isCompanionCall = false, orderId = 0) => {
  const caller = await User.findByPk(callerId);
  const callee = await User.findByPk(calleeId);
  
  if (!caller || !callee) {
    throw new Error('用户不存在');
  }
  
  const callNo = generateCallNo();
  const trtcRoomId = Math.floor(Math.random() * 1000000) + 1;
  
  const call = await CallRecord.create({
    call_no: callNo,
    caller_id: callerId,
    callee_id: calleeId,
    call_type: callType,
    trtc_room_id: trtcRoomId,
    status: 0,
    is_companion_call: isCompanionCall ? 1 : 0,
    order_id: orderId,
    create_time: getTimestamp()
  });
  
  return {
    callId: call.id,
    callNo: call.call_no,
    trtcRoomId: call.trtc_room_id
  };
};

const cancelCall = async (callerId, callId) => {
  const call = await CallRecord.findByPk(callId);
  
  if (!call) {
    throw new Error('通话不存在');
  }
  
  if (call.caller_id !== callerId) {
    throw new Error('无权操作此通话');
  }
  
  if (call.status !== 0) {
    throw new Error('通话状态不正确');
  }
  
  await call.update({
    status: 3,
    end_time: getTimestamp()
  });
  
  return true;
};

const rejectCall = async (calleeId, callId) => {
  const call = await CallRecord.findByPk(callId);
  
  if (!call) {
    throw new Error('通话不存在');
  }
  
  if (call.callee_id !== calleeId) {
    throw new Error('无权操作此通话');
  }
  
  if (call.status !== 0) {
    throw new Error('通话状态不正确');
  }
  
  await call.update({
    status: 2,
    end_time: getTimestamp()
  });
  
  return true;
};

const endCall = async (userId, callId) => {
  const call = await CallRecord.findByPk(callId);
  
  if (!call) {
    throw new Error('通话不存在');
  }
  
  if (call.caller_id !== userId && call.callee_id !== userId) {
    throw new Error('无权操作此通话');
  }
  
  if (call.status !== 1) {
    throw new Error('通话状态不正确');
  }
  
  const now = getTimestamp();
  const duration = call.connect_time > 0 ? now - call.connect_time : 0;
  
  await call.update({
    status: 4,
    end_time: now,
    duration
  });
  
  if (call.is_companion_call === 1 && duration > 0) {
    await createBilling(call, duration);
  }
  
  return { duration };
};

const acceptCall = async (calleeId, callId) => {
  const call = await CallRecord.findByPk(callId);
  
  if (!call) {
    throw new Error('通话不存在');
  }
  
  if (call.callee_id !== calleeId) {
    throw new Error('无权操作此通话');
  }
  
  if (call.status !== 0) {
    throw new Error('通话状态不正确');
  }
  
  await call.update({
    status: 1,
    connect_time: getTimestamp()
  });
  
  return true;
};

const createBilling = async (call, duration) => {
  const FREE_DURATION = 180;
  const BILLING_DURATION = 60;
  const COMPANION_RATIO = 0.7;
  
  let billableDuration = 0;
  if (duration > FREE_DURATION) {
    billableDuration = Math.ceil((duration - FREE_DURATION) / BILLING_DURATION) * BILLING_DURATION;
  }
  
  const unitPrice = 1;
  const totalFee = (billableDuration / 60) * unitPrice;
  const companionIncome = totalFee * COMPANION_RATIO;

  // 免费时长内不产生计费
  if (totalFee <= 0) {
    return;
  }

  const transaction = await sequelize.transaction();
  try {
    // 原子扣款：仅当余额充足时才扣减，避免并发超扣
    const [affected] = await User.update(
      { money: sequelize.literal(`money - ${totalFee}`) },
      { where: { id: call.caller_id, money: { [Op.gte]: totalFee } }, transaction }
    );
    if (!affected) {
      throw new Error('余额不足，通话已结束');
    }

    await User.increment('gift_money', {
      by: companionIncome,
      where: { id: call.callee_id },
      transaction
    });

    // 通话结束即完成扣款与分账，计费单直接标记为已结算（status=1），供钱包收入聚合统计
    await CallBilling.create({
      call_id: call.id,
      user_id: call.caller_id,
      companion_id: call.callee_id,
      duration: billableDuration,
      unit_price: unitPrice,
      total_amount: totalFee,
      status: 1,
      settle_time: getTimestamp(),
      create_time: getTimestamp()
    }, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getCallHistory = async (userId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const { count, rows } = await CallRecord.findAndCountAll({
    where: {
      [require('sequelize').Op.or]: [
        { caller_id: userId },
        { callee_id: userId }
      ]
    },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  const records = await Promise.all(rows.map(async (call) => {
    const otherUserId = call.caller_id === userId ? call.callee_id : call.caller_id;
    const otherUser = await User.findByPk(otherUserId);
    
    return {
      callId: call.id,
      callNo: call.call_no,
      callerId: call.caller_id,
      calleeId: call.callee_id,
      otherName: otherUser?.nickname || '',
      otherAvatar: otherUser?.avatar || '',
      callType: call.call_type,
      status: call.status,
      duration: call.duration,
      isCompanionCall: call.is_companion_call === 1,
      createTime: call.create_time,
      connectTime: call.connect_time
    };
  }));
  
  return {
    total: count,
    list: records
  };
};

module.exports = {
  startCall,
  cancelCall,
  rejectCall,
  endCall,
  acceptCall,
  getCallHistory
};
