const { walletService } = require('../services');
const response = require('../utils/response');

// 钱包总览：总资产 / 累计收入 / 已提现 / 今日收益
const getOverview = async (req, res) => {
  try {
    const data = await walletService.getWalletOverview(req.userId);
    response.success(res, data);
  } catch (error) {
    console.error('获取钱包总览错误:', error);
    response.error(res, error.message);
  }
};

// 收入明细列表
const getIncomeRecords = async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const data = await walletService.getIncomeRecords(req.userId, {
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 50
    });
    response.success(res, data);
  } catch (error) {
    console.error('获取收入明细错误:', error);
    response.error(res, error.message);
  }
};

// 收入来源构成（按来源聚合）
const getIncomeBreakdown = async (req, res) => {
  try {
    const data = await walletService.getIncomeBreakdown(req.userId);
    response.success(res, data);
  } catch (error) {
    console.error('获取收入构成错误:', error);
    response.error(res, error.message);
  }
};

// 提现记录
const getWithdrawRecords = async (req, res) => {
  try {
    const data = await walletService.getWithdrawRecords(req.userId);
    response.success(res, data);
  } catch (error) {
    console.error('获取提现记录错误:', error);
    response.error(res, error.message);
  }
};

// 从总资产提现
const applyWithdraw = async (req, res) => {
  try {
    const { amount, type, account } = req.body;
    if (!amount || amount <= 0) {
      return response.badRequest(res, '提现金额必须大于0');
    }
    const result = await walletService.applyWithdraw(req.userId, {
      amount: parseFloat(amount),
      type,
      account
    });
    response.success(res, result, '提现申请已提交');
  } catch (error) {
    console.error('钱包提现错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

// 支出明细列表
const getExpenseRecords = async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const data = await walletService.getExpenseRecords(req.userId, {
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 50
    });
    response.success(res, data);
  } catch (error) {
    console.error('获取支出明细错误:', error);
    response.error(res, error.message);
  }
};

// 支出总览
const getExpenseOverview = async (req, res) => {
  try {
    const data = await walletService.getExpenseOverview(req.userId);
    response.success(res, data);
  } catch (error) {
    console.error('获取支出总览错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getOverview,
  getIncomeRecords,
  getIncomeBreakdown,
  getWithdrawRecords,
  applyWithdraw,
  getExpenseRecords,
  getExpenseOverview
};
