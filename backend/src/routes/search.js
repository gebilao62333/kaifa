const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { optionalAuth } = require('../middlewares');
const { circleService } = require('../services');
const { User, Game } = require('../models');
const { getPrivacyPrefsForUsers } = require('../utils/privacyPrefs');
const { parseQuery, formatPaginatedResponse } = require('../utils/helper');
const { Op } = require('sequelize');

// LIKE 通配符转义：关键词里的 % / _ 按字面量匹配，避免把整表或任意单字符搜出来
const escapeLikeKeyword = (keyword) => String(keyword).replace(/[\\%_]/g, (ch) => '\\' + ch);

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
// 公开搜索：未登录也可浏览公开动态（服务层按可见范围过滤）
router.get('/posts', optionalAuth, async (req, res) => {
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

// P2-8：搜索普通用户（按昵称模糊匹配）
// - 未登录也可搜（optionalAuth），只返回 status=1 的正常账号；
// - 排除自己；遵守「允许被搜索」隐私开关（xn_user_pref.data.privacy.allowSearch）；
// - 只下发公开字段，手机号/余额等不在此接口返回。
router.get('/users', optionalAuth, async (req, res) => {
  try {
    const keyword = String(req.query.keyword === undefined ? '' : req.query.keyword).trim();
    if (!keyword) {
      return response.badRequest(res, '搜索关键词不能为空');
    }

    const { page, pageSize, offset, limit } = parseQuery(req.query);
    const where = {
      status: 1,
      nickname: { [Op.like]: '%' + escapeLikeKeyword(keyword) + '%' }
    };
    // 排除自己（未登录时 req.userId 为空，不追加条件）
    if (req.userId) {
      where.id = { [Op.ne]: Number(req.userId) };
    }

    const result = await User.findAndCountAll({
      where,
      attributes: ['id', 'nickname', 'avatar', 'lv', 'sex', 'fans_num'],
      offset,
      limit,
      order: [['id', 'DESC']]
    });
    const rows = result && Array.isArray(result.rows) ? result.rows : [];
    const count = result && Number.isFinite(Number(result.count)) ? Number(result.count) : rows.length;

    // C-9：批量读取隐私偏好，隐藏「允许被搜索」已关闭的账号（读取失败按默认公开降级）
    let prefsMap = {};
    try {
      prefsMap = await getPrivacyPrefsForUsers(rows.map((row) => row.id));
    } catch (error) {
      prefsMap = {};
    }

    const list = rows
      // 偏好缺失（读取失败/无记录）按默认「允许被搜索」处理，避免异常时把搜索结果全清空
      .filter((row) => !prefsMap[row.id] || prefsMap[row.id].allowSearch !== false)
      .map((row) => ({
        userId: row.id,
        nickname: row.nickname || '',
        avatar: row.avatar || '',
        level: row.lv || 1,
        sex: row.sex || 0,
        fansCount: row.fans_num || 0
      }));

    // 说明：total 为昵称命中总数（含已关闭「允许被搜索」的账号），仅用于分页展示，
    // 不会泄露这些账号的任何信息；如需精确计数可再引入按隐私过滤的统计查询。
    response.success(res, formatPaginatedResponse(list, count, page, pageSize));
  } catch (error) {
    logger.error('搜索用户错误:', error);
    response.error(res, error.message);
  }
});

// 搜索游戏
router.get('/games', optionalAuth, async (req, res) => {
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
