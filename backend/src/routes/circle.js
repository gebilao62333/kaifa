const express = require('express');
const router = express.Router();
const circleController = require('../controllers/circle');
const { authMiddleware, optionalAuth } = require('../middlewares');

router.get('/tags', circleController.getTags);
router.get('/posts', optionalAuth, circleController.getPosts);
router.get('/admin/posts', circleController.getAdminPosts);
router.get('/post/:id', optionalAuth, circleController.getPostDetail);
router.get('/my-posts', authMiddleware, circleController.getMyPosts);
router.get('/comments', circleController.getComments);
router.post('/create', authMiddleware, circleController.createPost);
router.post('/unlock', authMiddleware, circleController.unlockPost);
router.post('/like', authMiddleware, circleController.likePost);
router.post('/comment', authMiddleware, circleController.commentPost);

module.exports = router;
