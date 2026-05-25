const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: {
      status: 'healthy',
      timestamp: Date.now()
    }
  });
});

module.exports = router;
