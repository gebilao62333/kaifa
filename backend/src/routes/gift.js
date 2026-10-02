const express = require('express');
const router = express.Router();
const giftController = require('../controllers/gift');
const { authMiddleware } = require('../middlewares');

router.get('/list', giftController.getGiftList);
router.post('/send', authMiddleware, giftController.sendGift);
router.get('/bag', authMiddleware, giftController.getGiftBag);
router.post('/withdraw', authMiddleware, giftController.withdraw);

router.post('/redpacket/send', authMiddleware, giftController.sendRedPacket);
router.post('/redpacket/receive', authMiddleware, giftController.receiveRedPacket);
router.get('/redpacket/history', authMiddleware, giftController.getRedPacketHistory);

module.exports = router;
