const express = require('express');
const router = express.Router();
const circleController = require('../controllers/circle');
const { CircleTag } = require('../models');
const { authMiddleware, optionalAuth } = require('../middlewares');
const response = require('../utils/response');
const logger = require('../utils/logger');

router.get('/update-tags', async (req, res) => {
  try {
    await CircleTag.update({ name: '最热' }, { where: { id: 1 } });
    await CircleTag.update({ name: '新手报到' }, { where: { id: 2 } });
    response.success(res, {}, '标签更新成功');
  } catch (error) {
    logger.error('更新标签失败:', error);
    response.error(res, '更新标签失败');
  }
});

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
