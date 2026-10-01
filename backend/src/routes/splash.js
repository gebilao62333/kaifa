const express = require('express');
const router = express.Router();
const { SplashScreen } = require('../models');
const response = require('../utils/response');
const logger = require('../utils/logger');

// 获取当前活跃的开屏弹窗（C端）
router.get('/active', async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const { frequency = 'all', userId } = req.query;

    // 构建查询条件：状态启用 + 在有效期内
    const where = {
      status: 1,
      [require('sequelize').Op.or]: [
        { start_time: 0 },           // 未设置开始时间 = 立即生效
        { start_time: { [require('sequelize').Op.lte]: now } }
      ],
      [require('sequelize').Op.or]: [
        { end_time: 0 },             // 未设置结束时间 = 永不结束
        { end_time: { [require('sequelize').Op.gte]: now } }
      ]
    };

    // 如果客户端指定了频率筛选（已展示过的不再返回）
    if (frequency !== 'all') {
      // frequency: 2=每天一次, 3=每周一次, 4=仅一次 → 客户端按需过滤
      where.frequency = { [require('sequelize').Op.in]: [1] }; // 默认返回"每次打开"的
      // 如果客户端传了 frequency 参数，扩展范围
      const freqList = frequency.split(',').map(Number).filter(Boolean);
      if (freqList.length > 0) {
        where.frequency = { [require('sequelize').Op.in]: freqList.concat(1) }; // 始终包含"每次打开"
      }
    }

    const splashes = await SplashScreen.findAll({
      where,
      order: [['sort', 'DESC'], ['created_at', 'DESC']],
      limit: 5
    });

    response.success(res, {
      list: splashes.map(s => ({
        id: s.id,
        title: s.title,
        image: s.image,
        link: s.link || '',
        frequency: s.frequency,
        start_time: s.start_time,
        end_time: s.end_time,
        sort: s.sort
      }))
    });
  } catch (error) {
    logger.error('获取开屏弹窗错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
