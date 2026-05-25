const express = require('express');
const router = express.Router();
const reserveController = require('../controllers/reserve');
const { authMiddleware } = require('../middlewares');

router.get('/slots', authMiddleware, reserveController.getSlots);
router.post('/slots/batch', authMiddleware, reserveController.batchCreateSlots);
router.post('/slots/toggle', authMiddleware, reserveController.toggleSlot);
router.post('/create', authMiddleware, reserveController.createReserve);
router.post('/confirm', authMiddleware, reserveController.confirmReserve);
router.post('/reject', authMiddleware, reserveController.rejectReserve);
router.post('/cancel', authMiddleware, reserveController.cancelReserve);
router.post('/complete', authMiddleware, reserveController.completeReserve);
router.get('/list', authMiddleware, reserveController.getReserveList);

module.exports = router;
