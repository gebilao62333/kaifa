const express = require('express');
const router = express.Router();
const giftController = require('../controllers/gift');
const { authMiddleware, validate, LIMITS } = require('../middlewares');

// 审计 M-6：礼物/红包为资金相关写接口，统一在边界校验金额、数量与 ID 类型。
//   - receiverId/giftId/count 必须是整数；count 上限取 MONEY_MAX（前端按「余额/单价」推导，量级可达很大）；
//   - 红包 type 允许 0（随机）与 1（普通），totalNum 对齐服务端的 1~100。
// 注：红包 totalAmount 的下限（≥1）与提现下限仍由 giftService 负责，这里只拦负数/超大数/类型绕过。
const sendGiftSchema = {
  required: ['receiverId', 'giftId'],
  fields: {
    receiverId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    giftId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    roomId: { type: 'integer', min: 0, max: LIMITS.ID_MAX },
    count: { type: 'integer', min: 1, max: LIMITS.MONEY_MAX }
  }
};

const giftWithdrawSchema = {
  required: ['money'],
  fields: {
    money: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX },
    type: { type: 'integer', min: 1, max: 3 }
  }
};

const redPacketSendSchema = {
  required: ['totalAmount', 'totalNum'],
  fields: {
    type: { type: 'integer', enum: [0, 1] },
    totalAmount: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX },
    totalNum: { type: 'integer', min: 1, max: 100 },
    roomId: { type: 'integer', min: 0, max: LIMITS.ID_MAX },
    receiverId: { type: 'integer', min: 0, max: LIMITS.ID_MAX },
    message: { type: 'string', maxLength: 100 }
  }
};

// 审计 M-7：领取红包的入参此前未校验，且前端方法名与后端契约不一致（前端发 packetId、
// 后端读 packetNo）。后端契约以 packetNo 为准（聊天气泡与 e2e 脚本都用 packetNo），
// 这里显式校验并要求非空字符串。
const redPacketReceiveSchema = {
  required: ['packetNo'],
  fields: {
    packetNo: { type: 'string', minLength: 1, maxLength: 64 }
  }
};

router.get('/list', giftController.getGiftList);
router.post('/send', authMiddleware, validate(sendGiftSchema), giftController.sendGift);
router.get('/bag', authMiddleware, giftController.getGiftBag);
router.post('/withdraw', authMiddleware, validate(giftWithdrawSchema), giftController.withdraw);

router.post('/redpacket/send', authMiddleware, validate(redPacketSendSchema), giftController.sendRedPacket);
router.post('/redpacket/receive', authMiddleware, validate(redPacketReceiveSchema), giftController.receiveRedPacket);
router.get('/redpacket/history', authMiddleware, giftController.getRedPacketHistory);

module.exports = router;
