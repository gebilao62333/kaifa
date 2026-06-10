const CURRENCY_UNIT = '金币';
const EXCHANGE_RATE = 10;

// 从 config 动态读取（支持管理后台热更新）
const getConfig = () => {
  const config = require('../config');
  return {
    MIN_WITHDRAW_AMOUNT: (config.platform && config.platform.withdrawMinAmount) || 100,
    WITHDRAW_FEE_RATE: (config.platform && config.platform.withdrawFeeRate !== undefined) ? config.platform.withdrawFeeRate : 0.05
  };
};

const validateGoldCoins = (amount) => {
  const { MIN_WITHDRAW_AMOUNT } = getConfig();
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return { valid: false, message: '金额必须是数字' };
  }
  if (num <= 0) {
    return { valid: false, message: '金额必须大于0' };
  }
  if (num < MIN_WITHDRAW_AMOUNT) {
    return { valid: false, message: `最低金额为 ${MIN_WITHDRAW_AMOUNT} ${CURRENCY_UNIT}` };
  }
  return { valid: true, message: '' };
};

const formatCurrency = (amount, showUnit = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showUnit ? `0.00 ${CURRENCY_UNIT}` : '0.00';
  }
  const formatted = parseFloat(amount).toFixed(2);
  return showUnit ? `${formatted} ${CURRENCY_UNIT}` : formatted;
};

const convertToCoins = (fiatAmount) => {
  if (fiatAmount === null || fiatAmount === undefined || isNaN(fiatAmount)) {
    return 0;
  }
  return parseFloat(fiatAmount) * EXCHANGE_RATE;
};

const convertToFiat = (coins) => {
  if (coins === null || coins === undefined || isNaN(coins)) {
    return 0;
  }
  return parseFloat(coins) / EXCHANGE_RATE;
};

const calculateWithdrawFee = (coins) => {
  const { WITHDRAW_FEE_RATE } = getConfig();
  if (coins === null || coins === undefined || isNaN(coins)) {
    return 0;
  }
  return parseFloat(coins) * WITHDRAW_FEE_RATE;
};

const calculateNetWithdraw = (coins) => {
  const fee = calculateWithdrawFee(coins);
  return parseFloat(coins) - fee;
};

const normalizeAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }
  const num = parseFloat(amount);
  return isNaN(num) ? 0 : num;
};

const validateCurrencyUnit = (currency) => {
  if (!currency || currency.trim() !== CURRENCY_UNIT) {
    return { valid: false, message: `货币单位必须为 ${CURRENCY_UNIT}` };
  }
  return { valid: true, message: '' };
};

const createCurrencyMiddleware = () => {
  return (req, res, next) => {
    const body = req.body;
    
    if (body.currency && body.currency !== CURRENCY_UNIT) {
      return res.status(400).json({
        code: 400,
        message: `无效的货币单位，仅支持 ${CURRENCY_UNIT}`
      });
    }
    
    if (body.money !== undefined && body.goldCoins === undefined) {
      body.goldCoins = convertToCoins(body.money);
    }
    
    req.body = body;
    next();
  };
};

module.exports = {
  CURRENCY_UNIT,
  EXCHANGE_RATE,
  getConfig,
  validateGoldCoins,
  formatCurrency,
  convertToCoins,
  convertToFiat,
  calculateWithdrawFee,
  calculateNetWithdraw,
  normalizeAmount,
  validateCurrencyUnit,
  createCurrencyMiddleware
};