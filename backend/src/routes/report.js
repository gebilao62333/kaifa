const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');
const { authMiddleware, adminAuth, optionalAuth } = require('../middlewares');

router.post('/', authMiddleware, reportController.createReport);
router.get('/list', optionalAuth, reportController.getReportList);
router.post('/handle', optionalAuth, reportController.handleReport);

module.exports = router;
