const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middlewares');
const callConfigService = require('../services/callConfigService');

// 首页 / 全局配置
router.get('/home', (req, res) => {
  try {
    response.success(res, {
      appName: 'eu搭子',
      hotline: '400-888-8888',
      customerService: { wechat: 'eudazi_kf', qq: '800888888' },
      contact: { email: 'support@eudazi.com' },
      about: 'eu搭子 - 专业游戏陪玩与社交平台',
      rules: '请文明陪玩，禁止欺诈与违规内容。',
      features: {
        rechargeOpen: true,
        withdrawOpen: true,
        vipOpen: true,
        publishOpen: true
      }
    });
  } catch (error) {
    logger.error('获取首页配置错误:', error);
    response.error(res, error.message);
  }
});

// 通话配置：通道策略 + ICE 服务器（含临时 TURN 凭据）
// 需登录：TURN 临时凭据与用户绑定，便于溯源与限速
router.get('/call', authMiddleware, (req, res) => {
  try {
    response.success(res, callConfigService.getCallConfig(req.userId));
  } catch (error) {
    logger.error('获取通话配置错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
