const { User, Gift, GiftLog, GiftBag, RedPacket, RedPacketLog, Withdraw } = require('../models');
const { getTimestamp, generatePacketNo } = require('../utils/helper');
const { CURRENCY_UNIT, WITHDRAW_FEE_RATE, calculateWithdrawFee } = require('../utils/currency');
const { Op } = require('sequelize');
const sequelize = require('../config/mysql');

const sendGift = async (senderId, receiverId, giftId, roomId = 0) => {
  const gift = await Gift.findByPk(giftId);
  
  if (!gift || gift.status !== 1) {
    throw new Error('礼物不存在或已下架');
  }
  
  const sender = await User.findByPk(senderId);
  const receiver = await User.findByPk(receiverId);
  
  if (!sender || !receiver) {
    throw new Error('用户不存在');
  }
  
  const totalCost = Number(gift.money);
  
  if (Number(sender.money) < totalCost) {
    throw new Error('余额不足');
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    await User.decrement('money', {
      by: totalCost,
      where: { id: senderId },
      transaction
    });
    
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
      gift_num: 1,
      totalmoney: totalCost,
      currency: CURRENCY_UNIT,
      create_time: getTimestamp()
    }, { transaction });
    
    await transaction.commit();
    
    return {
      giftId: gift.id,
      giftName: gift.title,
      giftImage: gift.image,
      goldCoins: totalCost,
      currencyUnit: CURRENCY_UNIT
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
    image: gift.image,
    animation: gift.svga,
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
    await Withdraw.create({
      user_id: userId,
      money: amount,
      pay_money: netAmount,
      shouxufei: fee,
      type: type || 1,
      bank: bankInfo?.bank || '',
      name: bankInfo?.name || '',
      mobile: bankInfo?.mobile || user.mobile || '',
      image: bankInfo?.image || '',
      is_check: 0,
      state: 'pending',
      lailu: 'app',
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
    await transaction.rollback();
    throw error;
  }
};

const getWithdrawList = async (filters = {}) => {
  const where = {};

  if (filters.isCheck !== undefined) {
    where.is_check = filters.isCheck;
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { rows, count } = await Withdraw.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nickname', 'avatar', 'mobile']
    }],
    order: [['create_time', 'DESC']],
    limit: pageSize,
    offset: offset
  });

  return {
    list: rows.map(item => ({
      id: item.id,
      userId: item.user_id,
      userNickname: item.user?.nickname || '',
      userAvatar: item.user?.avatar || '',
      userMobile: item.user?.mobile || '',
      money: Number(item.money),
      payMoney: Number(item.pay_money),
      type: item.type,
      bank: item.bank,
      name: item.name,
      mobile: item.mobile,
      image: item.image,
      isCheck: item.is_check,
      state: item.state,
      wxTiId: item.wx_ti_id,
      createTime: item.create_time
    })),
    total: count,
    page,
    pageSize
  };
};

const approveWithdraw = async (withdrawId, adminId, transferBatchNo) => {
  const withdraw = await Withdraw.findByPk(withdrawId);

  if (!withdraw) {
    throw new Error('提现记录不存在');
  }

  if (withdraw.is_check !== 0) {
    throw new Error('该提现记录已审核过');
  }

  const transaction = await sequelize.transaction();

  try {
    await User.decrement('gift_money', {
      by: Number(withdraw.money),
      where: { id: withdraw.user_id },
      transaction
    });

    await withdraw.update({
      is_check: 1,
      state: 'approved',
      wx_ti_id: transferBatchNo || `WX${Date.now()}`,
      lailu: 'admin',
      create_time: withdraw.create_time
    }, { transaction });

    await transaction.commit();

    return { success: true, message: '提现审核通过' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const rejectWithdraw = async (withdrawId, adminId, reason) => {
  const withdraw = await Withdraw.findByPk(withdrawId);

  if (!withdraw) {
    throw new Error('提现记录不存在');
  }

  if (withdraw.is_check !== 0) {
    throw new Error('该提现记录已审核过');
  }

  await withdraw.update({
    is_check: 2,
    state: 'rejected',
    lailu: 'admin'
  });

  return { success: true, message: '提现申请已拒绝' };
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
    await User.decrement('money', {
      by: totalAmount,
      where: { id: senderId },
      transaction
    });
    
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
    amount = Math.random() * Number(packet.remain_amount);
    amount = Math.floor(amount * 100) / 100;
    if (amount < 0.01) amount = 0.01;
  } else {
    amount = Number(packet.total_amount) / packet.total_num;
    amount = Math.floor(amount * 100) / 100;
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    await RedPacketLog.create({
      packet_id: packet.id,
      user_id: userId,
      user_nickname: (await User.findByPk(userId))?.nickname || '',
      amount,
      create_time: getTimestamp()
    }, { transaction });
    
    await User.increment('money', {
      by: amount,
      where: { id: userId },
      transaction
    });
    
    if (packet.remain_num <= 1) {
      await packet.update({
        remain_num: 0,
        remain_amount: 0,
        status: 1
      }, { transaction });
    } else {
      await packet.update({
        remain_num: packet.remain_num - 1,
        remain_amount: Number(packet.remain_amount) - amount
      }, { transaction });
    }
    
    await transaction.commit();
    
    return { amount };
  } catch (error) {
    await transaction.rollback();
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
  getWithdrawList,
  approveWithdraw,
  rejectWithdraw,
  sendRedPacket,
  receiveRedPacket,
  getRedPacketHistory
};
