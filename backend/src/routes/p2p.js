const express = require('express');
const router = express.Router();
const p2pController = require('../controllers/p2pController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/peer-online', authMiddleware, p2pController.peerOnline);

module.exports = router;
