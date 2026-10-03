const express = require('express');
const router = express.Router();
const circleController = require('../controllers/circle');
const { authMiddleware, optionalAuth, adminAuth } = require('../middlewares');

router.get('/tags', circleController.getTags);
router.get('/posts', optionalAuth, circleController.getPosts);
router.get('/admin/posts', adminAuth, circleController.getAdminPosts);
router.get('/post/:id', optionalAuth, circleController.getPostDetail);
router.get('/my-posts', authMiddleware, circleController.getMyPosts);
// 审计 M1：评论/分享状态保持公开可读，但补 optionalAuth 以便识别登录态
router.get('/comments', optionalAuth, circleController.getComments);
router.post('/create', authMiddleware, circleController.createPost);
router.post('/unlock', authMiddleware, circleController.unlockPost);
router.post('/delete', authMiddleware, circleController.deletePost);
router.post('/like', authMiddleware, circleController.likePost);
router.post('/comment', authMiddleware, circleController.commentPost);
router.post('/share', authMiddleware, circleController.sharePost);
router.post('/repost', authMiddleware, circleController.repostPost);
router.get('/share-status', optionalAuth, circleController.getShareStatus);

module.exports = router;
