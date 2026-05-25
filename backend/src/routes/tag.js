const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag');
const { authMiddleware } = require('../middlewares');

router.post('/', authMiddleware, tagController.createTag);

router.get('/', authMiddleware, tagController.getAllTags);

router.get('/defaults', authMiddleware, tagController.getDefaultTags);

router.get('/recommend', authMiddleware, tagController.recommendTags);

router.get('/category/:category', authMiddleware, tagController.getTagsByCategory);

router.get('/:id', authMiddleware, tagController.getTag);

router.put('/:id', authMiddleware, tagController.updateTag);

router.delete('/:id', authMiddleware, tagController.deleteTag);

router.post('/init-defaults', authMiddleware, tagController.initDefaultTags);

router.get('/:tagId/users', authMiddleware, tagController.getTagUsers);

router.post('/assign', authMiddleware, tagController.assignTag);

router.post('/remove', authMiddleware, tagController.removeTag);

router.get('/user/:virtualUserId', authMiddleware, tagController.getUserTags);

router.post('/set-primary', authMiddleware, tagController.setPrimaryTag);

module.exports = router;
