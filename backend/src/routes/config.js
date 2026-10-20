const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middlewares');
const callConfigService = require('../services/callConfigService');
const { User } = require('../models');

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

// 在线客服：从环境变量读取真实客服账号（逗号分隔），未配置时明确告知前端，
// 不再由客户端硬编码 1001-1005 这类不存在的用户 ID（点进去必然会话加载失败）。
router.get('/support', authMiddleware, async (req, res) => {
  try {
    const ids = String(process.env.CUSTOMER_SERVICE_USER_IDS || process.env.CUSTOMER_SERVICE_USER_ID || '')
      .split(',')
      .map((id) => parseInt(id, 10))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    if (ids.length === 0) {
      return response.success(res, { configured: false, agents: [] }, '客服未配置');
    }
    const users = await User.findAll({
      where: { id: ids, status: 1 },
      attributes: ['id', 'nickname', 'avatar']
    });
    const byId = new Map(users.map((u) => [Number(u.id), u]));
    const agents = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((u) => ({ userId: Number(u.id), nickname: u.nickname || '', avatar: u.avatar || '' }));
    response.success(res, { configured: agents.length > 0, agents });
  } catch (error) {
    logger.error('获取客服账号错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
