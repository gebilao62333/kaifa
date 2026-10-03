const crypto = require('crypto');
const { User, Gift, GiftLog, GiftBag, RedPacket, RedPacketLog, Withdraw } = require('../models');
const { getTimestamp, generatePacketNo } = require('../utils/helper');
const { CURRENCY_UNIT, WITHDRAW_FEE_RATE, calculateWithdrawFee } = require('../utils/currency');
const { toFullUrl } = require('../utils/url');
const { Op } = require('sequelize');
const sequelize = require('../config/mysql');
const { moneyMinus, affectedCount } = require('../utils/sql');

const sendGift = async (senderId, receiverId, giftId, roomId = 0, count = 1) => {
  const gift = await Gift.findByPk(giftId);
  
  if (!gift || gift.status !== 1) {
    throw new Error('礼物不存在或已下架');
  }
  
  const sender = await User.findByPk(senderId);
  const receiver = await User.findByPk(receiverId);
  
  if (!sender || !receiver) {
    throw new Error('用户不存在');
  }
  
  const num = Math.max(1, parseInt(count) || 1);
  const totalCost = Number(gift.money) * num;
  
  const transaction = await sequelize.transaction();
  
  try {
    // 原子扣款：仅当余额充足时才扣减，避免并发超扣
    const [affected] = await User.update(
      { money: moneyMinus('money', totalCost) },
      { where: { id: senderId, money: { [Op.gte]: totalCost } }, transaction }
    );
    if (!affected) {
      throw new Error('余额不足');
    }
    
    const commission = totalCost * 0.7;
    
    await User.increment('money', {
      by: commission,
      where: { id: receiverId },
      transaction
    });
    
    await User.increment('gift_money', {
      by: commission,
      where: { id: receiverId },
      transaction
    });
    
    await User.increment('gift_money_zong', {
      by: commission,
      where: { id: receiverId },
      transaction
    });
    
    await GiftLog.create({
      user_id: receiverId,
      user_nickname: receiver.nickname,
      user_avatar: receiver.avatar,
      song_user_id: senderId,
      song_user_nickname: sender.nickname,
      song_user_avatar: sender.avatar,
      gift_id: giftId,
      gift_name: gift.title,
      gift_image: gift.image,
      gift_num: num,
      totalmoney: totalCost,
      currency: CURRENCY_UNIT,
      create_time: getTimestamp()
    }, { transaction });
    
    await transaction.commit();
    
    return {
      giftId: gift.id,
      giftName: gift.title,
      giftImage: toFullUrl(gift.image),
      goldCoins: totalCost,
      num,
      currencyUnit: CURRENCY_UNIT,
      giftType: gift.type,
      isVip: gift.is_vip,
      animation: toFullUrl(gift.svga)
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getGiftList = async (type = null) => {
  const where = { status: 1 };
  
  if (type !== null) {
    where.type = type;
  }
  
  const gifts = await Gift.findAll({
    where,
    order: [['sort', 'ASC'], ['id', 'ASC']]
  });
  
  return gifts.map(gift => ({
    giftId: gift.id,
    name: gift.title,
    image: toFullUrl(gift.image),
    animation: toFullUrl(gift.svga),
    goldCoins: Number(gift.money),
    currencyUnit: CURRENCY_UNIT,
    giftType: gift.type,
    isVip: gift.is_vip,
    validDays: gift.tian
  }));
};

const getGiftBag = async (userId) => {
  const items = await GiftBag.findAll({
    where: {
      user_id: userId,
      is_use: 0
    },
    order: [['create_time', 'DESC']]
  });
  
  return items.map(item => ({
    id: item.id,
    giftId: item.gift_id,
    giftName: item.gift_name,
    giftImage: item.gift_image,
    count: item.num,
    type: item.type,
    endTime: item.end_time
  }));
};

const withdraw = async (userId, goldCoins, type, bankInfo) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('用户不存在');
  }

  const amount = Number(goldCoins);
  
  if (amount < 100) {
    throw new Error(`最低提现金额为 100 ${CURRENCY_UNIT}`);
  }

  if (Number(user.gift_money) < amount) {
    throw new Error('可提现余额不足');
  }

  const fee = calculateWithdrawFee(amount);
  const netAmount = amount - fee;

  const transaction = await sequelize.transaction();

  try {
    // 申请即冻结：在同一事务内**条件扣减** gift_money（where 带余额判断，防并发超额提现）。
    // 历史 bug：这里只校验不扣款，用户可对同一笔余额反复发起提现。
    // 审核拒绝时由 controllers/admin.js rejectWithdraw 原路退回。
    const decreaseResult = await User.decrement('gift_money', {
      by: amount,
      where: { id: userId, gift_money: { [Op.gte]: amount } },
      transaction
    });

    if (affectedCount(decreaseResult) !== 1) {
      // 不在此处回滚：统一交给下方 catch 处理，避免二次 rollback 抛
      // "Transaction cannot be rolled back because it has been finished" 覆盖真实业务错误。
      throw new Error('可提现余额不足');
    }

    await Withdraw.create({
      user_id: userId,
      money: amount,
      amount: amount,
      pay_money: netAmount,
      shouxufei: fee,
      type: type || 1,
      bank: bankInfo?.bank || '',
      name: bankInfo?.name || '',
      mobile: bankInfo?.mobile || user.mobile || '',
      image: bankInfo?.image || '',
      is_check: 0,
      status: 0,
      state: 'pending',
      lailu: 'app',
      channel: 'gift',
      currency: CURRENCY_UNIT,
      create_time: getTimestamp()
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      message: '提现申请已提交，请等待审核',
      goldCoins: amount,
      fee: fee,
      netAmount: netAmount,
      currencyUnit: CURRENCY_UNIT
    };
  } catch (error) {
    if (!transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚，忽略 */ }
    }
    throw error;
  }
};


const sendRedPacket = async (senderId, type, totalAmount, totalNum, roomId = 0) => {
  if (totalAmount < 1) {
    throw new Error('红包金额不能少于1元');
  }
  
  if (totalNum < 1 || totalNum > 100) {
    throw new Error('红包个数必须在1-100之间');
  }
  
  const sender = await User.findByPk(senderId);
  
  if (!sender) {
    throw new Error('用户不存在');
  }
  
  if (Number(sender.money) < totalAmount) {
    throw new Error('余额不足');
  }
  
  const packetNo = generatePacketNo();
  const expireTime = getTimestamp() + 24 * 60 * 60;
  
  const transaction = await sequelize.transaction();
  
  try {
    // 原子扣款：仅当余额充足时才扣减，避免并发超扣
    const [affected] = await User.update(
      { money: moneyMinus('money', totalAmount) },
      { where: { id: senderId, money: { [Op.gte]: totalAmount } }, transaction }
    );
    if (!affected) {
      throw new Error('余额不足');
    }
    
    await RedPacket.create({
      packet_no: packetNo,
      sender_id: senderId,
      sender_nickname: sender.nickname,
      type,
      total_num: totalNum,
      total_amount: totalAmount,
      remain_num: totalNum,
      remain_amount: totalAmount,
      expire_time: expireTime,
      status: 0,
      create_time: getTimestamp()
    }, { transaction });
    
    await transaction.commit();
    
    return {
      packetNo,
      expireTime
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const receiveRedPacket = async (userId, packetNo) => {
  const packet = await RedPacket.findOne({
    where: { packet_no: packetNo }
  });
  
  if (!packet) {
    throw new Error('红包不存在');
  }
  
  if (packet.status !== 0) {
    throw new Error('红包已过期或已领完');
  }
  
  if (packet.expire_time < getTimestamp()) {
    throw new Error('红包已过期');
  }
  
  if (packet.sender_id === userId) {
    throw new Error('不能领取自己的红包');
  }
  
  const existingReceive = await RedPacketLog.findOne({
    where: {
      packet_id: packet.id,
      user_id: userId
    }
  });
  
  if (existingReceive) {
    throw new Error('已领取过该红包');
  }
  
  let amount;
  
  if (packet.type === 1) {
    // 拼手气红包必须用密码学安全随机数：Math.random 可被预测，会被用来挑时间点抢大包
    const remainCents = Math.max(1, Math.floor(Number(packet.remain_amount) * 100));
    amount = crypto.randomInt(1, remainCents + 1) / 100;
    amount = Math.floor(amount * 100) / 100;
    if (amount < 0.01) amount = 0.01;
  } else {
    amount = Number(packet.total_amount) / packet.total_num;
    amount = Math.floor(amount * 100) / 100;
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    // 审计 B-01：重复领取检查与名额扣减都必须在事务内完成。
    // 原实现把 findOne 放在事务外，并发请求可同时通过检查 → 同一红包被重复领取。
    // 名额用**条件更新**原子占用（remain_num > 0 才会成功），越领在数据库层被拦下。
    const claimed = await RedPacketLog.findOne({
      where: { packet_id: packet.id, user_id: userId },
      transaction
    });
    if (claimed) {
      throw new Error('已领取过该红包');
    }

    const [reserved] = await RedPacket.update(
      {
        remain_num: sequelize.literal('remain_num - 1'),
        remain_amount: sequelize.literal('GREATEST(remain_amount - ' + String(amount) + ', 0)')
      },
      { where: { id: packet.id, remain_num: { [Op.gt]: 0 } }, transaction }
    );
    if (!reserved) {
      throw new Error('红包已被抢完');
    }

    await RedPacketLog.create({
      packet_id: packet.id,
      user_id: userId,
      user_nickname: (await User.findByPk(userId, { transaction }))?.nickname || '',
      amount,
      create_time: getTimestamp()
    }, { transaction });
    
    await User.increment('money', {
      by: amount,
      where: { id: userId },
      transaction
    });
    
    // 名额领完则关闭红包（条件更新，避免覆盖其它并发请求的结果）
    await RedPacket.update(
      { remain_num: 0, remain_amount: 0, status: 1 },
      { where: { id: packet.id, remain_num: { [Op.lte]: 0 } }, transaction }
    );
    
    await transaction.commit();
    
    return { amount };
  } catch (error) {
    await transaction.rollback();
    // 唯一索引冲突（(packet_id,user_id)）说明并发生效，统一转为业务错误
    if (/duplicate|ER_DUP_ENTRY/i.test(error.message || '')) {
      throw new Error('已领取过该红包');
    }
    throw error;
  }
};

const getRedPacketHistory = async (userId, type = 'all') => {
  const results = [];
  
  if (type === 'all' || type === 'sent') {
    const sentPackets = await RedPacket.findAll({
      where: { sender_id: userId },
      order: [['create_time', 'DESC']],
      limit: 50
    });
    
    results.push(...sentPackets.map(packet => ({
      id: packet.id,
      type: 'sent',
      packetNo: packet.packet_no,
      amount: Number(packet.total_amount),
      count: packet.total_num,
      packetType: packet.type === 1 ? 'lucky' : 'normal',
      status: packet.status,
      desc: `发送了${packet.type === 1 ? '拼手气' : '普通'}红包 x${packet.total_num}`,
      createTime: packet.create_time
    })));
  }
  
  if (type === 'all' || type === 'received') {
    const receivedLogs = await RedPacketLog.findAll({
      where: { user_id: userId },
      order: [['create_time', 'DESC']],
      limit: 50
    });
    
    for (const log of receivedLogs) {
      const packet = await RedPacket.findByPk(log.packet_id);
      results.push({
        id: log.id,
        type: 'received',
        packetNo: packet?.packet_no || '',
        amount: Number(log.amount),
        count: 1,
        packetType: packet?.type === 1 ? 'lucky' : 'normal',
        status: 1,
        desc: `领取了红包`,
        createTime: log.create_time
      });
    }
  }
  
  results.sort((a, b) => b.createTime - a.createTime);
  
  return results.slice(0, 50);
};

module.exports = {
  sendGift,
  getGiftList,
  getGiftBag,
  withdraw,
  sendRedPacket,
  receiveRedPacket,
  getRedPacketHistory
};
