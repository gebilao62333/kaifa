const express = require('express');
const router = express.Router();
const response = require('../utils/response');

// 公告 / 通知列表（公开）
router.get('/list', (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const list = [
      {
        id: 1,
        title: '暑期陪玩狂欢活动',
        content: '活动期间首单立减，邀请好友还可获得返现奖励，快来参与吧！',
        type: 'activity',
        createTime: now - 86400
      },
      {
        id: 2,
        title: 'VIP 特权正式上线',
        content: '开通 VIP 即可享受专属标识、折扣优惠与优先匹配等特权。',
        type: 'notice',
        createTime: now - 172800
      },
      {
        id: 3,
        title: '用户协议与隐私政策更新',
        content: '我们已更新最新版用户协议与隐私政策，继续使用即代表您已阅读并同意。',
        type: 'notice',
        createTime: now - 259200
      }
    ];
    response.success(res, { list });
  } catch (error) {
    console.error('获取公告列表错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
