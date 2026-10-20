const express = require('express');
const router = express.Router();
const reserveController = require('../controllers/reserve');
const { authMiddleware, validate, LIMITS } = require('../middlewares');

// 《未完成事项清单》B-13：预约写接口统一入参校验（按 type 只校验确定语义的字段，时长/价格保持宽松）
const reserveIdSchema = {
  required: ['reserveId'],
  fields: { reserveId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const createReserveSchema = {
  required: ['companionId', 'date', 'time'],
  fields: {
    companionId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    // 前端未选游戏时传 gameId=0（控制器按「无游戏」处理），所以下界是 0
    gameId: { type: 'integer', min: 0, max: LIMITS.ID_MAX },
    date: { type: 'string', maxLength: 20 },
    time: { type: 'string', maxLength: 20 },
    remark: { type: 'string', maxLength: 500 },
    serviceType: { type: 'string', maxLength: 32 }
  }
};
const toggleSlotSchema = {
  required: ['slotId'],
  fields: { slotId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const batchSlotsSchema = {
  required: ['slots'],
  fields: {}
};
const rejectReserveSchema = {
  required: ['reserveId'],
  fields: {
    reserveId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    reason: { type: 'string', maxLength: 500 }
  }
};

router.get('/slots', authMiddleware, reserveController.getSlots);
router.post('/slots/batch', authMiddleware, validate(batchSlotsSchema), reserveController.batchCreateSlots);
router.post('/slots/toggle', authMiddleware, validate(toggleSlotSchema), reserveController.toggleSlot);
router.post('/create', authMiddleware, validate(createReserveSchema), reserveController.createReserve);
router.post('/confirm', authMiddleware, validate(reserveIdSchema), reserveController.confirmReserve);
router.post('/reject', authMiddleware, validate(rejectReserveSchema), reserveController.rejectReserve);
router.post('/cancel', authMiddleware, validate(reserveIdSchema), reserveController.cancelReserve);
router.post('/complete', authMiddleware, validate(reserveIdSchema), reserveController.completeReserve);
router.get('/list', authMiddleware, reserveController.getReserveList);
router.get('/detail', authMiddleware, reserveController.getReserveDetail);

module.exports = router;
