const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demand');
const { authMiddleware } = require('../middlewares');

router.post('/create', authMiddleware, demandController.createDemand);
router.get('/list', authMiddleware, demandController.getDemandList);
router.get('/detail', authMiddleware, demandController.getDemandDetail);
router.post('/cancel', authMiddleware, demandController.cancelDemand);

module.exports = router;
