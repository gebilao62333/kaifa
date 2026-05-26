const express = require('express');
const router = express.Router();
const { generateQRCode } = require('../utils/qrcodeGenerator');

router.post('/qrcode', (req, res) => {
  try {
    const { text, width = 200, margin = 4 } = req.body;
    
    if (!text) {
      return res.json({
        code: 400,
        message: '缺少必要参数 text'
      });
    }

    const result = generateQRCode(text, {
      width,
      margin,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    if (result.success) {
      res.json({
        code: 200,
        message: '生成成功',
        data: {
          svg: result.svg,
          base64: result.base64,
          text: result.text
        }
      });
    } else {
      res.json({
        code: 500,
        message: '生成失败: ' + result.error
      });
    }
  } catch (error) {
    res.json({
      code: 500,
      message: '生成失败: ' + error.message
    });
  }
});

router.get('/qrcode', (req, res) => {
  try {
    const { text, width = 200, margin = 4 } = req.query;
    
    if (!text) {
      return res.json({
        code: 400,
        message: '缺少必要参数 text'
      });
    }

    const result = generateQRCode(decodeURIComponent(text), {
      width: parseInt(width),
      margin: parseInt(margin),
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    if (result.success) {
      res.json({
        code: 200,
        message: '生成成功',
        data: {
          svg: result.svg,
          base64: result.base64,
          text: result.text
        }
      });
    } else {
      res.json({
        code: 500,
        message: '生成失败: ' + result.error
      });
    }
  } catch (error) {
    res.json({
      code: 500,
      message: '生成失败: ' + error.message
    });
  }
});

module.exports = router;