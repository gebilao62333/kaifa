const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '多客陪玩后端API服务',
    data: {
      version: '3.0.0',
      name: 'duoke-peer-backend'
    }
  });
});

module.exports = router;
