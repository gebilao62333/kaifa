const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload');
const { authMiddleware, uploadLimiter } = require('../middlewares');
const upload = require('../config/upload');

router.post('/image', authMiddleware, uploadLimiter, upload.single('image'), uploadController.uploadImage);
router.post('/audio', authMiddleware, uploadLimiter, upload.single('audio'), uploadController.uploadAudio);
router.post('/video', authMiddleware, uploadLimiter, upload.single('video'), uploadController.uploadVideo);

module.exports = router;
