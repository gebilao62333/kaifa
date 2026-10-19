const express = require('express');
const router = express.Router();
const payController = require('../controllers/pay');
const { authMiddleware, adminAuth, requirePermission, cardLimiter, validate, LIMITS } = require('../middlewares');

// 审计 M-6：支付/充值写接口统一校验 packageId。
// 刻意不校验 payType：客户端（脚本/旧前端）会传字符串 "alipay"/"wechat"，controller 内部 parseInt 兜底，
// 若在此声明为 integer 会把既有的正常下单变成 400。
const packageIdSchema = {
  required: ['packageId'],
  fields: {
    packageId: { type: 'integer', min: 1, max: LIMITS.ID_MAX }
  }
};

const rechargeSchema = {
  required: ['amount'],
  fields: {
    amount: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX },
    userId: { type: 'integer', min: 1, max: LIMITS.ID_MAX }
  }
};

router.get('/packages', payController.getPackages);
router.post('/create-order', authMiddleware, validate(packageIdSchema), payController.createOrder);
router.post('/wx-order', authMiddleware, validate(packageIdSchema), payController.createWxOrder);
router.post('/wx-notify', payController.wxNotify);
router.get('/wx-query', authMiddleware, payController.queryWxOrder);
router.post('/wx-close', authMiddleware, payController.closeWxOrder);
// 审计 H-2：客户端回执这条路由原先不带登录态，任何知道（或枚举到）订单号的人都能触发该单入账。
// 现在要求登录，且服务层再校验「订单属于当前用户」——只有下单人本人能确认自己这单的支付回执。
router.post('/wx-callback', authMiddleware, payController.wxCallback);
router.get('/order-status', authMiddleware, payController.getOrderStatus);
// 审计 C-3：卡密是「凭凭证兑现」的资产，三条口子都要限流，且校验口不再免登录。
//   - /validate-card 原先不带 authMiddleware，任何人无需登录即可批量判断卡号是否存在
//     （枚举 oracle），且服务端从不比对 card_password，拿到卡号就能直接 /use-card 入账；
//   - 现在校验与核销都要求「卡号 + 密码」双项，校验口同时要求登录；
//   - /use-card、/redeem-key 也挂 cardLimiter，防止 25 位密钥被暴力枚举。
router.post('/validate-card', authMiddleware, cardLimiter, payController.validateCard);
router.post('/use-card', authMiddleware, cardLimiter, payController.useCard);
router.post('/redeem-key', authMiddleware, cardLimiter, payController.redeemCardByKey);
router.get('/recharge/list', adminAuth, payController.getRechargeRecords);

router.get('/wallet/balance', authMiddleware, payController.getWalletBalance);
// 审计 M14 / 越权充值：该接口会直接给用户加余额，原先只校验普通用户 JWT，
// 等于"任何登录用户 POST 一次即可无限给自己充值"。改为管理端接口 + 权限校验。
router.post('/wallet/recharge', adminAuth, requirePermission('recharge:write'), validate(rechargeSchema), payController.rechargeWallet);
router.get('/payment/history', authMiddleware, payController.getPaymentHistory);
router.post('/pay/create', authMiddleware, validate(packageIdSchema), payController.createPayment);

// 2026-10-03 已删除 POST /api/pay/pay/notify —— 无签名校验，任何人都能伪造支付成功给自己充值。
// 支付结果只能来自微信服务端回调 /api/pay/wx-notify（校验 MD5 签名），
// 或经 /api/pay/wx-callback 反查订单确认后入账。

module.exports = router;