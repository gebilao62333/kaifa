const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album');
const { authMiddleware } = require('../middlewares');
const upload = require('../config/upload');

router.get('/photos', authMiddleware, albumController.getPhotos);
router.post('/upload', authMiddleware, upload.single('image'), albumController.uploadPhoto);
router.post('/delete', authMiddleware, albumController.deletePhoto);
router.post('/like', authMiddleware, albumController.likePhoto);

module.exports = router;
