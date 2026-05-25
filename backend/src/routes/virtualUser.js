const express = require('express');
const router = express.Router();
const virtualUserController = require('../controllers/virtualUser');
const { authMiddleware } = require('../middlewares');

router.post('/', authMiddleware, virtualUserController.createVirtualUser);

router.get('/', authMiddleware, virtualUserController.getAllVirtualUsers);

router.get('/:id', authMiddleware, virtualUserController.getVirtualUser);

router.put('/:id', authMiddleware, virtualUserController.updateVirtualUser);

router.delete('/:id', authMiddleware, virtualUserController.deleteVirtualUser);

router.post('/:id/status', authMiddleware, virtualUserController.toggleOnlineStatus);

router.post('/:virtualUserId/chat', authMiddleware, virtualUserController.chatWithVirtualUser);

router.get('/:virtualUserId/history', authMiddleware, virtualUserController.getChatHistory);

router.delete('/:virtualUserId/context', authMiddleware, virtualUserController.clearContext);

module.exports = router;
