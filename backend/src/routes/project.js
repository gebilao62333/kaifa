const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project');
const { authMiddleware } = require('../middlewares');

router.get('/stats', authMiddleware, projectController.getStats);
router.get('/', authMiddleware, projectController.getList);
router.post('/', authMiddleware, projectController.create);
router.get('/:id', authMiddleware, projectController.getById);
router.put('/:id', authMiddleware, projectController.update);
router.delete('/:id', authMiddleware, projectController.deleteProject);
router.post('/:id/start', authMiddleware, projectController.start);
router.post('/:id/stop', authMiddleware, projectController.stop);
router.post('/:id/restart', authMiddleware, projectController.restart);
router.post('/:id/toggle-status', authMiddleware, projectController.toggleStatus);
router.get('/:id/orders', authMiddleware, projectController.getOrders);

module.exports = router;
