const express = require('express');
const router = express.Router();
const circleController = require('../controllers/circle');
const { authMiddleware, optionalAuth, adminAuth, validate, LIMITS } = require('../middlewares');

// 《未完成事项清单》B-13：圈子写接口入参校验。
// 发帖允许「文字 / 图片 / 视频」任一存在，因此不设 required；数组字段（images/videos/tagIds）由控制器归一。
const createPostSchema = {
  fields: {
    // 0 公开 / 1 仅关注 / 2 私密 / 3 密码查看 / 4 付费查看
    visibility: { type: 'integer', min: 0, max: 4 },
    password: { type: 'string', maxLength: 64 },
    price: { type: 'number', min: 0, max: LIMITS.MONEY_MAX },
    location: { type: 'string', maxLength: 255 }
  }
};
const postIdSchema = {
  required: ['postId'],
  fields: { postId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const unlockPostSchema = {
  required: ['postId'],
  fields: {
    postId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    unlockType: { type: 'integer', min: 1, max: 3 },
    password: { type: 'string', maxLength: 64 }
  }
};
const commentPostSchema = {
  required: ['postId', 'content'],
  fields: {
    postId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    content: { type: 'string', minLength: 1, maxLength: 1000 },
    replyId: { type: 'integer', min: 0, max: LIMITS.ID_MAX }
  }
};
const repostPostSchema = {
  required: ['postId'],
  fields: {
    postId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    comment: { type: 'string', maxLength: 500 }
  }
};

router.get('/tags', circleController.getTags);
router.get('/posts', optionalAuth, circleController.getPosts);
router.get('/admin/posts', adminAuth, circleController.getAdminPosts);
router.get('/post/:id', optionalAuth, circleController.getPostDetail);
router.get('/my-posts', authMiddleware, circleController.getMyPosts);
// 审计 M1：评论/分享状态保持公开可读，但补 optionalAuth 以便识别登录态
router.get('/comments', optionalAuth, circleController.getComments);
router.post('/create', authMiddleware, validate(createPostSchema), circleController.createPost);
router.post('/unlock', authMiddleware, validate(unlockPostSchema), circleController.unlockPost);
router.post('/delete', authMiddleware, validate(postIdSchema), circleController.deletePost);
router.post('/like', authMiddleware, validate(postIdSchema), circleController.likePost);
router.post('/comment', authMiddleware, validate(commentPostSchema), circleController.commentPost);
router.post('/share', authMiddleware, validate(postIdSchema), circleController.sharePost);
router.post('/repost', authMiddleware, validate(repostPostSchema), circleController.repostPost);
router.get('/share-status', optionalAuth, circleController.getShareStatus);

module.exports = router;
