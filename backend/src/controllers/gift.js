const { giftService } = require('../services');
const { Withdraw } = require('../models');
const logger = require('../utils/logger');
const response = require('../utils/response');

const getGiftList = async (req, res) => {
  try {
    const { type } = req.query;
    const result = await giftService.getGiftList(type !== undefined ? parseInt(type) : null);
    response.success(res, result);
  } catch (error) {
    logger.error('获取礼物列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const sendGift = async (req, res) => {
  try {
    const { receiverId, giftId, roomId } = req.body;
    
    if (!receiverId || !giftId) {
      return response.badRequest(res, '接收者和礼物ID不能为空');
    }
    
    const result = await giftService.sendGift(
      req.userId,
      parseInt(receiverId),
      parseInt(giftId),
      roomId ? parseInt(roomId) : 0
    );
    response.success(res, result, '赠送成功');
  } catch (error) {
    logger.error('赠送礼物错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getGiftBag = async (req, res) => {
  try {
    const result = await giftService.getGiftBag(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取背包错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const withdraw = async (req, res) => {
  try {
    const { money, type, bankInfo } = req.body;

    if (!money || money <= 0) {
      return response.badRequest(res, '提现金额必须大于0');
    }

    const result = await giftService.withdraw(req.userId, parseFloat(money), parseInt(type) || 1, bankInfo);
    response.success(res, result, '提现申请已提交');
  } catch (error) {
    logger.error('提现错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getWithdrawConfig = async (req, res) => {
  try {
    const config = require('../config');
    response.success(res, {
      minWithdrawAmount: config.platform?.withdrawMinAmount || 10,
      withdrawFeeRate: config.platform?.withdrawFeeRate || 0.01,
      minAmount: config.platform?.withdrawMinAmount || 10,
      feeRate: config.platform?.withdrawFeeRate || 0.01
    });
  } catch (error) {
    logger.error('获取提现配置错误:', error);
    response.error(res, '操作失败');
  }
};

const getWithdrawList = async (req, res) => {
  try {
    const { isCheck, page, pageSize } = req.query;
    
    const where = {};
    if (isCheck !== undefined && isCheck !== '') {
      where.is_check = parseInt(isCheck);
    }
    
    const result = await Withdraw.findAndCountAll({
      where,
      order: [['create_time', 'DESC']],
      limit: parseInt(pageSize) || 20,
      offset: ((parseInt(page) || 1) - 1) * (parseInt(pageSize) || 20)
    });
    
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;
    const list = result.rows || [];
    const total = result.count || 0;
    
    response.success(res, {
      list: list.map(w => ({
        id: w.id,
        user_id: w.user_id,
        nickname: w.nickname || '',
        avatar: w.avatar || '',
        amount: w.amount,
        type: w.type,
        account: w.account || '',
        real_name: w.real_name || '',
        status: w.status,
        is_check: w.is_check,
        create_time: w.create_time
      })),
      pagination: {
        page: pageNum,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    logger.error('获取提现列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const approveWithdraw = async (req, res) => {
  try {
    const { withdrawId, transferBatchNo } = req.body;

    if (!withdrawId) {
      return response.badRequest(res, '提现记录ID不能为空');
    }

    const result = await giftService.approveWithdraw(parseInt(withdrawId), req.userId, transferBatchNo);
    response.success(res, result, '提现审核通过');
  } catch (error) {
    logger.error('审核提现错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const rejectWithdraw = async (req, res) => {
  try {
    const { withdrawId, reason } = req.body;

    if (!withdrawId) {
      return response.badRequest(res, '提现记录ID不能为空');
    }

    const result = await giftService.rejectWithdraw(parseInt(withdrawId), req.userId, reason);
    response.success(res, result, '提现申请已拒绝');
  } catch (error) {
    logger.error('拒绝提现错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const sendRedPacket = async (req, res) => {
  try {
    const { type = 0, totalAmount, totalNum, roomId } = req.body;
    
    if (!totalAmount || !totalNum) {
      return response.badRequest(res, '红包金额和个数不能为空');
    }
    
    const result = await giftService.sendRedPacket(
      req.userId,
      parseInt(type),
      parseFloat(totalAmount),
      parseInt(totalNum),
      roomId ? parseInt(roomId) : 0
    );
    response.success(res, result, '红包已发送');
  } catch (error) {
    logger.error('发送红包错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const receiveRedPacket = async (req, res) => {
  try {
    const { packetNo } = req.body;
    
    if (!packetNo) {
      return response.badRequest(res, '红包编号不能为空');
    }
    
    const result = await giftService.receiveRedPacket(req.userId, packetNo);
    response.success(res, result, '领取成功');
  } catch (error) {
    logger.error('领取红包错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getRedPacketHistory = async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const result = await giftService.getRedPacketHistory(req.userId, type);
    response.success(res, result);
  } catch (error) {
    logger.error('获取红包记录错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

module.exports = {
  getGiftList,
  sendGift,
  getGiftBag,
  getWithdrawConfig,
  withdraw,
  getWithdrawList,
  approveWithdraw,
  rejectWithdraw,
  sendRedPacket,
  receiveRedPacket,
  getRedPacketHistory
};
