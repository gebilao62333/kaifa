const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload');
const { authMiddleware, uploadLimiter } = require('../middlewares');
const upload = require('../config/upload');

router.post('/image', authMiddleware, uploadLimiter, upload.single('image'), uploadController.uploadImage);
router.post('/audio', authMiddleware, uploadLimiter, upload.single('audio'), uploadController.uploadAudio);
router.post('/video', authMiddleware, uploadLimiter, upload.single('video'), uploadController.uploadVideo);

// 前端直传流程：先拿预签名凭证，直传 COS 后回传 URL 登记
router.get('/token', authMiddleware, uploadLimiter, uploadController.getUploadToken);
router.post('/register', authMiddleware, uploadLimiter, uploadController.registerUpload);

module.exports = router;
