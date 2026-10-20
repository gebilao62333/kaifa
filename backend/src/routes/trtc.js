const express = require('express');
const router = express.Router();
const trtcController = require('../controllers/trtc');
const { authMiddleware, validate, LIMITS } = require('../middlewares');

// 《未完成事项清单》B-13：通话链路写接口入参校验。ID 类一律正整数，房间号兼容数字字符串。
const callIdSchema = {
  required: ['callId'],
  fields: { callId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const startCallSchema = {
  required: ['calleeId'],
  fields: {
    calleeId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    callType: { type: 'integer', min: 1, max: 3 },
    orderId: { type: 'integer', min: 0, max: LIMITS.ID_MAX }
  }
};
const roomIdSchema = {
  required: ['roomId'],
  fields: { roomId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const createRoomSchema = {
  fields: { roomType: { type: 'string', maxLength: 16 } }
};
const startBillingSchema = {
  required: ['roomId'],
  fields: {
    roomId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    callType: { type: 'integer', min: 1, max: 3 }
  }
};
const endBillingSchema = {
  required: ['billingId'],
  fields: { billingId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};

router.get('/auth', authMiddleware, trtcController.getAuth);
router.post('/start', authMiddleware, validate(startCallSchema), trtcController.startCall);
router.post('/cancel', authMiddleware, validate(callIdSchema), trtcController.cancelCall);
router.post('/reject', authMiddleware, validate(callIdSchema), trtcController.rejectCall);
router.post('/accept', authMiddleware, validate(callIdSchema), trtcController.acceptCall);
router.post('/end', authMiddleware, validate(callIdSchema), trtcController.endCall);
router.get('/history', authMiddleware, trtcController.getCallHistory);

router.post('/room/create', authMiddleware, validate(createRoomSchema), trtcController.createRoom);
router.post('/room/enter', authMiddleware, validate(roomIdSchema), trtcController.enterRoom);
router.post('/room/leave', authMiddleware, validate(roomIdSchema), trtcController.leaveRoom);
router.get('/room/:roomId', authMiddleware, trtcController.getRoomInfo);
router.post('/billing/start', authMiddleware, validate(startBillingSchema), trtcController.startBilling);
router.post('/billing/end', authMiddleware, validate(endBillingSchema), trtcController.endBilling);

module.exports = router;
