const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authMiddleware, validate, LIMITS } = require('../middlewares');

router.use(authMiddleware);

// 审计 M-6：金额写接口统一在边界校验——负数/超大数/数组绕过（parseFloat([100])===100）在此拦下。
// 业务下限（最低提现 100）仍由 walletService 负责，这里只做类型与量级防线。
const withdrawSchema = {
  required: ['amount', 'type'],
  fields: {
    amount: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX },
    type: { type: 'integer', enum: [1, 2, 3] },
    account: { type: 'string', maxLength: 255 },
    name: { type: 'string', maxLength: 50 },
    image: { type: 'string', maxLength: 255 },
    bank: { type: 'string', maxLength: 255 }
  }
};

// 钱包总览
router.get('/overview', walletController.getOverview);
// 收入明细
router.get('/income-records', walletController.getIncomeRecords);
// 收入来源构成
router.get('/income-breakdown', walletController.getIncomeBreakdown);
// 提现记录（钱包渠道）
router.get('/withdraw-records', walletController.getWithdrawRecords);
// 支出明细列表
router.get('/expense-records', walletController.getExpenseRecords);
// 支出总览（支出总额 / 今日支出）
router.get('/expense-overview', walletController.getExpenseOverview);
// 从总资产提现
router.post('/withdraw', validate(withdrawSchema), walletController.applyWithdraw);

module.exports = router;
