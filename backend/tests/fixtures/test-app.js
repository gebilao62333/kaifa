const express = require('express');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: {
      status: 'healthy',
      timestamp: Date.now()
    }
  });
});

app.get('/api/user/test', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      userId: 1,
      nickname: 'Test User'
    }
  });
});

app.post('/api/user/test', (req, res) => {
  const { name } = req.body;
  res.status(201).json({
    code: 201,
    message: '创建成功',
    data: { id: 1, name }
  });
});

app.get('/api/error', (req, res) => {
  res.status(500).json({
    code: 500,
    message: '服务器错误'
  });
});

app.get('/api/notfound', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

module.exports = app;
