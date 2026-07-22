const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authMiddleware } = require('../middlewares');

router.use(authMiddleware);

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
router.post('/withdraw', walletController.applyWithdraw);

module.exports = router;
