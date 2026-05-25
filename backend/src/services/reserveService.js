const { Reserve, ReserveSlot, User, Game } = require('../models');
const { getTimestamp, parseQuery } = require('../utils/helper');
const { Op } = require('sequelize');

const getAvailableSlots = async (companionId, date, gameId) => {
  const slots = await ReserveSlot.findAll({
    where: {
      user_id: companionId,
      reserve_date: date,
      status: 0
    },
    order: [['reserve_time', 'ASC']]
  });

  return slots.map(slot => ({
    slotId: slot.id,
    time: slot.reserve_time,
    status: slot.status
  }));
};

const batchCreateSlots = async (companionId, gameId, slots) => {
  for (const slot of slots) {
    await ReserveSlot.findOrCreate({
      where: {
        user_id: companionId,
        reserve_date: slot.date,
        reserve_time: slot.time
      },
      defaults: {
        game_id: gameId,
        status: 0,
        create_time: getTimestamp()
      }
    });
  }

  return true;
};

const toggleSlot = async (companionId, slotId) => {
  const slot = await ReserveSlot.findOne({
    where: {
      id: slotId,
      user_id: companionId
    }
  });

  if (!slot) {
    throw new Error('时间槽不存在');
  }

  const newStatus = slot.status === 0 ? 2 : 0;
  await slot.update({ status: newStatus });

  return { status: newStatus };
};

const createReserve = async (userId, companionId, gameId, date, time) => {
  const slot = await ReserveSlot.findOne({
    where: {
      user_id: companionId,
      reserve_date: date,
      reserve_time: time,
      status: 0
    }
  });

  if (!slot) {
    throw new Error('该时间段不可预约');
  }

  const existing = await Reserve.findOne({
    where: {
      target_user_id: companionId,
      reserve_date: date,
      reserve_time: time,
      status: {
        [Op.in]: [0, 1]
      }
    }
  });

  if (existing) {
    throw new Error('该时间段已被预约');
  }

  const reserve = await Reserve.create({
    user_id: userId,
    target_user_id: companionId,
    game_id: gameId,
    reserve_date: date,
    reserve_time: time,
    status: 0,
    create_time: getTimestamp()
  });

  await slot.update({ status: 1 });

  return {
    reserveId: reserve.id
  };
};

const confirmReserve = async (companionId, reserveId) => {
  const reserve = await Reserve.findByPk(reserveId);

  if (!reserve) {
    throw new Error('预约不存在');
  }

  if (reserve.target_user_id !== companionId) {
    throw new Error('无权操作此预约');
  }

  if (reserve.status !== 0) {
    throw new Error('预约状态不正确');
  }

  await reserve.update({
    status: 1,
    update_time: getTimestamp()
  });

  return true;
};

const rejectReserve = async (companionId, reserveId) => {
  const reserve = await Reserve.findByPk(reserveId);

  if (!reserve) {
    throw new Error('预约不存在');
  }

  if (reserve.target_user_id !== companionId) {
    throw new Error('无权操作此预约');
  }

  if (reserve.status !== 0) {
    throw new Error('预约状态不正确');
  }

  await reserve.update({
    status: 2,
    update_time: getTimestamp()
  });

  await ReserveSlot.update({
    status: 0
  }, {
    where: {
      user_id: companionId,
      reserve_date: reserve.reserve_date,
      reserve_time: reserve.reserve_time
    }
  });

  return true;
};

const cancelReserve = async (userId, reserveId) => {
  const reserve = await Reserve.findByPk(reserveId);

  if (!reserve) {
    throw new Error('预约不存在');
  }

  if (reserve.user_id !== userId) {
    throw new Error('无权操作此预约');
  }

  if (reserve.status !== 0 && reserve.status !== 1) {
    throw new Error('预约无法取消');
  }

  const reserveDateTime = new Date(`${reserve.reserve_date} ${reserve.reserve_time}`).getTime();
  const now = Date.now();
  const hoursUntilReserve = (reserveDateTime - now) / (1000 * 60 * 60);

  let refundRate = 0;
  if (hoursUntilReserve >= 24) {
    refundRate = 1;
  } else if (hoursUntilReserve >= 12) {
    refundRate = 0.5;
  }

  await reserve.update({
    status: 4,
    update_time: getTimestamp()
  });

  await ReserveSlot.update({
    status: 0
  }, {
    where: {
      user_id: reserve.target_user_id,
      reserve_date: reserve.reserve_date,
      reserve_time: reserve.reserve_time
    }
  });

  return { refundRate };
};

const completeReserve = async (userId, reserveId) => {
  const reserve = await Reserve.findByPk(reserveId);

  if (!reserve) {
    throw new Error('预约不存在');
  }

  if (reserve.user_id !== userId && reserve.target_user_id !== userId) {
    throw new Error('无权操作此预约');
  }

  if (reserve.status !== 1) {
    throw new Error('预约状态不正确，仅可完成已确认的预约');
  }

  await reserve.update({
    status: 3,
    update_time: getTimestamp()
  });

  return true;
};

const getReserveList = async (userId, role, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const where = role === 'companion'
    ? { target_user_id: userId }
    : { user_id: userId };

  const { count, rows } = await Reserve.findAndCountAll({
    where,
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });

  const reserves = await Promise.all(rows.map(async (reserve) => {
    const otherUserId = role === 'companion' ? reserve.user_id : reserve.target_user_id;
    const otherUser = await User.findByPk(otherUserId);
    const game = await Game.findByPk(reserve.game_id);

    return {
      reserveId: reserve.id,
      userId: reserve.user_id,
      companionId: reserve.target_user_id,
      companionName: otherUser?.nickname || '',
      companionAvatar: otherUser?.avatar || '',
      gameId: reserve.game_id,
      gameName: game?.name || '',
      date: reserve.reserve_date,
      time: reserve.reserve_time,
      status: reserve.status,
      createTime: reserve.create_time
    };
  }));

  return {
    total: count,
    list: reserves
  };
};

module.exports = {
  getAvailableSlots,
  batchCreateSlots,
  toggleSlot,
  createReserve,
  confirmReserve,
  rejectReserve,
  cancelReserve,
  completeReserve,
  getReserveList
};
