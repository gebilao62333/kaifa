const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/games');
const { authMiddleware } = require('../middlewares');

router.get('/categories', gamesController.getCategories);
// 首页公开陪玩师列表（不依赖登录态，供未登录用户浏览）
router.get('/companions', gamesController.getCompanions);
router.get('/search', authMiddleware, gamesController.searchCompanions);
router.post('/push', authMiddleware, gamesController.createOrder);
router.post('/grab', authMiddleware, gamesController.grabOrder);
router.post('/start', authMiddleware, gamesController.startOrder);
router.post('/complete', authMiddleware, gamesController.completeOrder);
router.post('/cancel', authMiddleware, gamesController.cancelOrder);
router.get('/orders', authMiddleware, gamesController.getOrders);
router.post('/apply', authMiddleware, gamesController.applyAsCompanion);
router.get('/apply/status', authMiddleware, gamesController.getApplyStatus);

module.exports = router;
