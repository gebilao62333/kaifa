const express = require('express');
const router = express.Router();
const response = require('../utils/response');

router.get('/', (req, res) => {
  response.success(res, {
    version: '3.0.0',
    name: 'duoke-peer-backend'
  }, '多客陪玩后端API服务');
});

module.exports = router;
