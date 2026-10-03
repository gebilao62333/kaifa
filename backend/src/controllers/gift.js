const { giftService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

// 礼物/红包作为聊天消息落库的类型（0文本 1语音 2图片 3视频 4位置，6礼物 7红包）
const MESSAGE_TYPE_GIFT = 6;
const MESSAGE_TYPE_RED_PACKET = 7;

/**
 * 把礼物/红包落成一条聊天消息并实时推给接收方。
 * 此前礼物只写 xn_gift_log、红包只写 xn_red_packet，既不进聊天记录也不推 socket，
 * 导致接收方既看不到、刷新后也查不到。
 */
const dispatchChatMessage = async (fromId, toId, type, contentObj, socketExtra) => {
  const content = JSON.stringify(contentObj);
  let messageId = 0;
  let sendTime = Math.floor(Date.now() / 1000);

  try {
    // 懒加载：避免在不需要 socket 的场景（如单测 mock services）引入额外依赖
    const chatService = require('../services').chatService;
    const saved = await chatService.sendMessage(fromId, Number(toId), content, type);
    messageId = saved.messageId;
    sendTime = saved.sendTime;
  } catch (e) {
    logger.error('礼物/红包消息落库失败:', e.message);
  }

  try {
    const { sendToUser } = require('../socket');
    sendToUser(Number(toId), 'private_message', Object.assign({
        id: messageId,
        fromId,
        toId: Number(toId),
        content,
        type,
        mediaUrl: '',
        duration: 0,
        sendTime,
        isRevoked: false
    }, socketExtra || {}));
  } catch (e) {
    logger.error('礼物/红包消息推送失败:', e.message);
  }

  return messageId;
};

const getGiftList = async (req, res) => {
  try {
    const { type } = req.query;
    const result = await giftService.getGiftList(type !== undefined ? parseInt(type) : null);
    response.success(res, result);
  } catch (error) {
    logger.error('获取礼物列表错误:', error);
    response.error(res, error.message);
  }
};

const sendGift = async (req, res) => {
  try {
    const { receiverId, giftId, roomId, count } = req.body;
    
    if (!receiverId || !giftId) {
      return response.badRequest(res, '接收者和礼物ID不能为空');
    }
    
    const result = await giftService.sendGift(
      req.userId,
      parseInt(receiverId),
      parseInt(giftId),
      roomId ? parseInt(roomId) : 0,
      count ? parseInt(count) : 1
    );

    // 落聊天消息 + 实时推送（否则接收方看不到礼物）
    await dispatchChatMessage(req.userId, receiverId, MESSAGE_TYPE_GIFT, {
      kind: 'gift',
      giftId: result.giftId,
      name: result.giftName,
      icon: result.giftImage,
      count: result.num,
      giftType: result.giftType,
      animation: result.animation || ''
    }, {
      giftName: result.giftName,
      giftImage: result.giftImage,
      giftCount: result.num,
      giftType: result.giftType,
      giftAnimation: result.animation || ''
    });

    response.success(res, result, '赠送成功');
  } catch (error) {
    logger.error('赠送礼物错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getGiftBag = async (req, res) => {
  try {
    const result = await giftService.getGiftBag(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取背包错误:', error);
    response.error(res, error.message);
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
    response.unprocessableEntity(res, error.message);
  }
};


const sendRedPacket = async (req, res) => {
  try {
    const { type = 0, totalAmount, totalNum, roomId, receiverId, message } = req.body;
    
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

    // 指定接收者时（1v1 私聊），同样落聊天消息并实时推送
    const packetMessage = message || '恭喜发财，大吉大利';
    if (receiverId) {
      await dispatchChatMessage(req.userId, receiverId, MESSAGE_TYPE_RED_PACKET, {
        kind: 'redpacket',
        packetNo: result.packetNo,
        amount: parseFloat(totalAmount),
        count: parseInt(totalNum),
        message: packetMessage
      }, {
        packetNo: result.packetNo,
        amount: parseFloat(totalAmount),
        count: parseInt(totalNum),
        message: packetMessage
      });
    }

    response.success(res, result, '红包已发送');
  } catch (error) {
    logger.error('发送红包错误:', error);
    response.unprocessableEntity(res, error.message);
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
    response.unprocessableEntity(res, error.message);
  }
};

const getRedPacketHistory = async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const result = await giftService.getRedPacketHistory(req.userId, type);
    response.success(res, result);
  } catch (error) {
    logger.error('获取红包记录错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getGiftList,
  sendGift,
  getGiftBag,
  withdraw,
  sendRedPacket,
  receiveRedPacket,
  getRedPacketHistory
};
