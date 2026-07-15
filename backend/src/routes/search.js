const express = require('express');
const router = express.Router();
const response = require('../utils/response');

// 热门搜索词
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
    console.error('获取热搜错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
