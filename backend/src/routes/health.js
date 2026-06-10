const express = require('express');
const router = express.Router();
const response = require('../utils/response');

router.get('/health', (req, res) => {
  response.success(res, {
    status: 'healthy',
    timestamp: Date.now()
  }, 'OK');
});

module.exports = router;
