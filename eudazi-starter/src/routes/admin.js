// 后台管理路由：登录 + 下载管理（下载接口需 adminAuth 鉴权）。
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin');
const downloadCtrl = require('../controllers/download');
const { adminAuth } = require('../middlewares');

// 登录免鉴权
router.post('/login', adminCtrl.login);

// 下载管理（受保护）
router.get('/downloads', adminAuth, downloadCtrl.getList);
router.get('/downloads/:id', adminAuth, downloadCtrl.getDetail);
router.post('/downloads', adminAuth, downloadCtrl.create);
router.put('/downloads/:id', adminAuth, downloadCtrl.update);
router.patch('/downloads/:id/status', adminAuth, downloadCtrl.updateStatus);
router.delete('/downloads/:id', adminAuth, downloadCtrl.remove);

module.exports = router;
