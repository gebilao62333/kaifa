const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middlewares');
const { circleService } = require('../services');
const { Game } = require('../models');
const { Op } = require('sequelize');

// 热门搜索词
// ⚠️ 占位数据：当前返回硬编码热搜词，尚未落库；如需动态热搜应接入统计/配置表。
router.get('/hot', (req, res) => {
  try {
    const hotList = [
      { keyword: '王者荣耀', tag: '热门' },
      { keyword: '和平精英', tag: '热门' },
      { keyword: '英雄联盟', tag: '' },
      { keyword: '陪玩师小美', tag: '沸' },
      { keyword: '狼人杀', tag: '' },
      { keyword: '剧本杀', tag: '' },
      { keyword: '聊天搭子', tag: '' },
      { keyword: '上分车队', tag: '' }
    ];
    response.success(res, { list: hotList });
  } catch (error) {
    logger.error('获取热搜错误:', error);
    response.error(res, error.message);
  }
});

// 搜索动态
router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    if (!keyword || !String(keyword).trim()) {
      return response.badRequest(res, '搜索关键词不能为空');
    }
    const result = await circleService.searchPosts(req.userId, keyword, page, pageSize);
    response.success(res, result);
  } catch (error) {
    logger.error('搜索动态错误:', error);
    response.error(res, error.message);
  }
});

// 搜索游戏
router.get('/games', authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || !String(keyword).trim()) {
      return response.badRequest(res, '搜索关键词不能为空');
    }

    const games = await Game.findAll({
      where: {
        status: 1,
        name: { [Op.like]: `%${String(keyword).trim()}%` }
      },
      order: [['sort', 'DESC'], ['id', 'ASC']],
      limit: 20
    });

    response.success(res, {
      list: games.map(g => ({
        gameId: g.id,
        name: g.name,
        icon: g.image || '',
        background: g.image_bg || ''
      }))
    });
  } catch (error) {
    logger.error('搜索游戏错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
