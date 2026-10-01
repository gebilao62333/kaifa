const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag');
const { authMiddleware, adminAuth } = require('../middlewares');

// 标签库为全局资源，增删改仅限管理员；查询对登录用户开放
router.post('/', adminAuth, tagController.createTag);

router.get('/', authMiddleware, tagController.getAllTags);

router.get('/defaults', authMiddleware, tagController.getDefaultTags);

router.get('/recommend', authMiddleware, tagController.recommendTags);

router.get('/category/:category', authMiddleware, tagController.getTagsByCategory);

router.get('/:id', authMiddleware, tagController.getTag);

router.put('/:id', adminAuth, tagController.updateTag);

router.delete('/:id', adminAuth, tagController.deleteTag);

router.post('/init-defaults', adminAuth, tagController.initDefaultTags);

router.get('/:tagId/users', authMiddleware, tagController.getTagUsers);

router.post('/assign', adminAuth, tagController.assignTag);

router.post('/remove', adminAuth, tagController.removeTag);

router.get('/user/:virtualUserId', authMiddleware, tagController.getUserTags);

router.post('/set-primary', adminAuth, tagController.setPrimaryTag);

module.exports = router;
