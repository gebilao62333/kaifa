const express = require('express');
const router = express.Router();
const response = require('../utils/response');

// 首页 / 全局配置
router.get('/home', (req, res) => {
  try {
    response.success(res, {
      appName: '多客陪玩',
      hotline: '400-888-8888',
      customerService: { wechat: 'duoke_kf', qq: '800888888' },
      contact: { email: 'support@duoke.com' },
      about: '多客陪玩 - 专业游戏陪玩与社交平台',
      rules: '请文明陪玩，禁止欺诈与违规内容。',
      features: {
        rechargeOpen: true,
        withdrawOpen: true,
        vipOpen: true,
        publishOpen: true
      }
    });
  } catch (error) {
    console.error('获取首页配置错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
