const { reserveService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');

const getSlots = async (req, res) => {
  try {
    const { companionId, date, gameId } = req.query;
    
    if (!companionId || !date) {
      return response.badRequest(res, '陪玩师ID和日期不能为空');
    }
    
    const result = await reserveService.getAvailableSlots(
      parseInt(companionId),
      date,
      gameId ? parseInt(gameId) : null
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取可用时间错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const batchCreateSlots = async (req, res) => {
  try {
    const { gameId, slots } = req.body;
    
    if (!slots || slots.length === 0) {
      return response.badRequest(res, '时间槽不能为空');
    }
    
    await reserveService.batchCreateSlots(req.userId, gameId ? parseInt(gameId) : 0, slots);
    response.success(res, {}, '设置成功');
  } catch (error) {
    logger.error('批量设置时间错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const toggleSlot = async (req, res) => {
  try {
    const { slotId } = req.body;
    
    if (!slotId) {
      return response.badRequest(res, '时间槽ID不能为空');
    }
    
    const result = await reserveService.toggleSlot(req.userId, parseInt(slotId));
    response.success(res, result);
  } catch (error) {
    logger.error('切换时间槽状态错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const createReserve = async (req, res) => {
  try {
    const { companionId, gameId, date, time } = req.body;
    
    if (!companionId || !date || !time) {
      return response.badRequest(res, '陪玩师ID、日期和时间不能为空');
    }
    
    const result = await reserveService.createReserve(
      req.userId,
      parseInt(companionId),
      gameId ? parseInt(gameId) : 0,
      date,
      time
    );
    response.created(res, result, '预约成功');
  } catch (error) {
    logger.error('创建预约错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const confirmReserve = async (req, res) => {
  try {
    const { reserveId } = req.body;
    
    if (!reserveId) {
      return response.badRequest(res, '预约ID不能为空');
    }
    
    await reserveService.confirmReserve(req.userId, parseInt(reserveId));
    response.success(res, {}, '已确认预约');
  } catch (error) {
    logger.error('确认预约错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const rejectReserve = async (req, res) => {
  try {
    const { reserveId } = req.body;
    
    if (!reserveId) {
      return response.badRequest(res, '预约ID不能为空');
    }
    
    await reserveService.rejectReserve(req.userId, parseInt(reserveId));
    response.success(res, {}, '已拒绝预约');
  } catch (error) {
    logger.error('拒绝预约错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const cancelReserve = async (req, res) => {
  try {
    const { reserveId } = req.body;
    
    if (!reserveId) {
      return response.badRequest(res, '预约ID不能为空');
    }
    
    const result = await reserveService.cancelReserve(req.userId, parseInt(reserveId));
    response.success(res, result, '已取消预约');
  } catch (error) {
    logger.error('取消预约错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getReserveList = async (req, res) => {
  try {
    const { role, page = 1, pageSize = 20 } = req.query;

    const result = await reserveService.getReserveList(
      req.userId,
      role || 'user',
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取预约列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const completeReserve = async (req, res) => {
  try {
    const { reserveId } = req.body;

    if (!reserveId) {
      return response.badRequest(res, '预约ID不能为空');
    }

    await reserveService.completeReserve(req.userId, parseInt(reserveId));
    response.success(res, {}, '预约已完成');
  } catch (error) {
    logger.error('完成预约错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getReserveDetail = async (req, res) => {
  try {
    const { reserveId } = req.query;

    if (!reserveId) {
      return response.badRequest(res, '预约ID不能为空');
    }

    const { Reserve } = require('../models');
    const reserve = await Reserve.findByPk(parseInt(reserveId));
    if (!reserve) {
      return response.badRequest(res, '预约不存在');
    }

    response.success(res, {
      id: reserve.id,
      userId: reserve.user_id,
      companionId: reserve.companion_id,
      gameId: reserve.game_id,
      date: reserve.date,
      time: reserve.time,
      status: reserve.status,
      remark: reserve.remark || '',
      createTime: reserve.create_time
    });
  } catch (error) {
    logger.error('获取预约详情错误:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

module.exports = {
  getSlots,
  batchCreateSlots,
  toggleSlot,
  createReserve,
  confirmReserve,
  rejectReserve,
  cancelReserve,
  completeReserve,
  getReserveList,
  getReserveDetail
};
