const { Reserve, ReserveSlot, User, Game } = require('../models');
const { getTimestamp, parseQuery } = require('../utils/helper');
const { Op } = require('sequelize');
const sequelize = require('../config/mysql');
const { getCommissionRate } = require('./settingsService');
const { moneyMinus } = require('../utils/sql');

// 预约完成结算分成（陪玩师占比）默认值：系统设置 reserve_commission_rate 缺省时使用（全额给陪玩师）
const RESERVE_COMMISSION_DEFAULT = 1;

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

  // 审计 H-7：已成交（status=1）的时段一律不可切换——原实现会把 1 翻回 0，
  // 等于凭空释放一个已被占用的时段，直接造成同一时段被重复预约。
  if (slot.status === 1) {
    throw new Error('该时间段已被预约，不可修改');
  }

  const newStatus = slot.status === 0 ? 2 : 0;

  // 条件更新：只有仍处在读取时的状态才算切换成功，避免并发切换把状态写反。
  const [claimed] = await ReserveSlot.update(
    { status: newStatus },
    { where: { id: slotId, user_id: companionId, status: slot.status } }
  );

  if (!claimed) {
    throw new Error('时间槽状态已变更，请刷新后重试');
  }

  return { status: newStatus };
};

const createReserve = async (userId, companionId, gameId, date, time, extra = {}) => {
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

  const price = extra.price != null ? parseFloat(extra.price) : 0;
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('预约金额不正确');
  }

  // 事务内：原子占用时段 + 扣款 + 建预约单，避免并发重复预约与并发超扣
  const transaction = await sequelize.transaction();
  try {
    const [claimed] = await ReserveSlot.update(
      { status: 1 },
      { where: { id: slot.id, status: 0 }, transaction }
    );
    if (!claimed) {
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
      },
      transaction
    });

    if (existing) {
      throw new Error('该时间段已被预约');
    }

    // 收费预约：下单即原子扣款（仅当余额充足时）
    if (price > 0) {
      const [affected] = await User.update(
        { money: moneyMinus('money', price) },
        { where: { id: userId, money: { [Op.gte]: price } }, transaction }
      );
      if (!affected) {
        throw new Error('余额不足');
      }
    }

    const reserve = await Reserve.create({
      user_id: userId,
      target_user_id: companionId,
      game_id: gameId,
      reserve_date: date,
      reserve_time: time,
      duration: parseInt(extra.duration) || 0,
      price,
      remark: extra.remark || '',
      service_type: extra.serviceType || 'online',
      status: 0,
      create_time: getTimestamp()
    }, { transaction });

    await transaction.commit();

    return {
      reserveId: reserve.id,
      price
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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

  // 审计 H-7：状态迁移改为条件更新（WHERE status=0），并发确认只会有一次生效，
  // 后续状态（拒绝/取消）不会与被本次覆盖的写入交错。
  const [claimed] = await Reserve.update(
    { status: 1, update_time: getTimestamp() },
    { where: { id: reserveId, target_user_id: companionId, status: 0 } }
  );

  if (!claimed) {
    throw new Error('预约状态不正确');
  }

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

  // 审计 H-7：拒绝涉及「预约单状态 + 时间槽释放」两处写入，必须同事务且先占位再释放，
  // 否则并发拒绝会各自释放一次时间槽、甚至覆盖已重新被占用的槽位。
  const transaction = await sequelize.transaction();

  try {
    const [claimed] = await Reserve.update(
      { status: 2, update_time: getTimestamp() },
      { where: { id: reserveId, target_user_id: companionId, status: 0 }, transaction }
    );

    if (!claimed) {
      throw new Error('预约状态不正确');
    }

    await ReserveSlot.update(
      { status: 0 },
      {
        where: {
          user_id: companionId,
          reserve_date: reserve.reserve_date,
          reserve_time: reserve.reserve_time,
          status: 1
        },
        transaction
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

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

  // 按距预约开始时间计算退款比例：>=24h 全退，>=12h 退 50%，否则不退
  const reserveDateTime = new Date(`${reserve.reserve_date} ${reserve.reserve_time}`).getTime();
  const hoursUntilReserve = (reserveDateTime - Date.now()) / (1000 * 60 * 60);
  let refundRate = 0;
  if (hoursUntilReserve >= 24) {
    refundRate = 1;
  } else if (hoursUntilReserve >= 12) {
    refundRate = 0.5;
  }

  const price = Number(reserve.price) || 0;
  const refundAmount = Math.round(price * refundRate * 100) / 100;

  const transaction = await sequelize.transaction();
  try {
    // 审计 H-7：退款前先抢占状态迁移（WHERE status IN (0,1)），
    // 两个并发取消只有一个能进入退款分支，重复退款从根上不可能；
    // 同项目 cancelOrder 早已是这个写法，此处属遗漏。
    const [claimed] = await Reserve.update(
      { status: 4, update_time: getTimestamp() },
      {
        where: {
          id: reserveId,
          user_id: userId,
          status: { [Op.in]: [0, 1] }
        },
        transaction
      }
    );

    if (!claimed) {
      throw new Error('预约无法取消');
    }

    await ReserveSlot.update({
      status: 0
    }, {
      where: {
        user_id: reserve.target_user_id,
        reserve_date: reserve.reserve_date,
        reserve_time: reserve.reserve_time,
        status: 1
      },
      transaction
    });

    // 退款入账（按比例）
    if (refundAmount > 0) {
      await User.increment('money', {
        by: refundAmount,
        where: { id: reserve.user_id },
        transaction
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return { success: true, refundRate, refundAmount, price };
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

  const price = Number(reserve.price) || 0;
  const companionUserId = reserve.target_user_id;

  const transaction = await sequelize.transaction();
  try {
    // 审计 H-7：分成比例必须在事务内读取，且先抢占状态迁移再打款——
    // 改造前「findByPk 判 status=1 → update(status=3) → increment(gift_money)」，
    // 两个并发完成请求会各自通过校验并各分一次账（重复分账）。
    const rate = await getCommissionRate('reserve_commission_rate', RESERVE_COMMISSION_DEFAULT, transaction);
    const companionIncome = Math.round(price * rate * 100) / 100;

    const [claimed] = await Reserve.update(
      { status: 3, update_time: getTimestamp() },
      {
        where: {
          id: reserveId,
          status: 1,
          [Op.or]: [
            { user_id: userId },
            { target_user_id: userId }
          ]
        },
        transaction
      }
    );

    if (!claimed) {
      throw new Error('预约状态不正确，仅可完成已确认的预约');
    }

    // 完成结算：按系统设置比例把预约金额计入陪玩师可提现收入
    if (companionIncome > 0 && companionUserId) {
      await User.increment('gift_money', {
        by: companionIncome,
        where: { id: companionUserId },
        transaction
      });
      await User.increment('gift_money_zong', {
        by: companionIncome,
        where: { id: companionUserId },
        transaction
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return true;
};

const getReserveList = async (userId, role, status, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const where = role === 'companion'
    ? { target_user_id: userId }
    : { user_id: userId };

  if (status !== undefined && status !== null && status !== '') {
    where.status = Number(status);
  }

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

// 审计 B-13：原实现不校验归属，任何登录用户都能按 reserveId 查看任意预约详情（IDOR）。
const getReserveDetail = async (reserveId, requesterId) => {
  const reserve = await Reserve.findByPk(reserveId);
  if (!reserve) {
    throw new Error('预约不存在');
  }

  if (requesterId !== undefined && requesterId !== null) {
    const isOwner = Number(reserve.user_id) === Number(requesterId);
    const isCompanion = Number(reserve.target_user_id) === Number(requesterId);
    if (!isOwner && !isCompanion) {
      throw new Error('无权查看此预约');
    }
  }

  const user = await User.findByPk(reserve.user_id);
  const companion = await User.findByPk(reserve.target_user_id);
  const game = await Game.findByPk(reserve.game_id);

  return {
    reserveId: reserve.id,
    user: {
      userId: user?.id,
      nickname: user?.nickname || '',
      avatar: user?.avatar || ''
    },
    companion: {
      userId: companion?.id,
      nickname: companion?.nickname || '',
      avatar: companion?.avatar || ''
    },
    gameId: reserve.game_id,
    gameName: game?.name || '',
    date: reserve.reserve_date,
    time: reserve.reserve_time,
    status: reserve.status,
    createTime: reserve.create_time,
    updateTime: reserve.update_time
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
  getReserveList,
  getReserveDetail
};
