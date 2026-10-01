// 公开下载路由：供官网 / 落地页读取与跳转，无需鉴权。
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/download');

// 公开下载信息列表（需放在 /:platform 之前优先匹配）
router.get('/platforms', ctrl.getPublicPlatforms);
// 按平台 302 跳转：/api/download/ios | /android | /harmony
router.get('/:platform', ctrl.redirectDownload);

module.exports = router;
