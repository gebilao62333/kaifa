const express = require('express');
const router = express.Router();
const trtcController = require('../controllers/trtc');
const { authMiddleware } = require('../middlewares');

router.get('/auth', authMiddleware, trtcController.getAuth);
router.post('/start', authMiddleware, trtcController.startCall);
router.post('/cancel', authMiddleware, trtcController.cancelCall);
router.post('/reject', authMiddleware, trtcController.rejectCall);
router.post('/accept', authMiddleware, trtcController.acceptCall);
router.post('/end', authMiddleware, trtcController.endCall);
router.get('/history', authMiddleware, trtcController.getCallHistory);

router.post('/room/create', authMiddleware, trtcController.createRoom);
router.post('/room/enter', authMiddleware, trtcController.enterRoom);
router.post('/room/leave', authMiddleware, trtcController.leaveRoom);
router.get('/room/:roomId', authMiddleware, trtcController.getRoomInfo);
router.post('/billing/start', authMiddleware, trtcController.startBilling);
router.post('/billing/end', authMiddleware, trtcController.endBilling);

module.exports = router;
