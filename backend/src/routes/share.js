const express = require('express');
const router = express.Router();
const { generateQRCode } = require('../utils/qrcodeGenerator');
const crypto = require('crypto');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 根据用户 ID 生成邀请码
 * 格式：字母数字组合，长度 8 位
 */
const generateInviteCode = (userId) => {
  const hash = crypto.createHash('md5').update(`invite_${userId}_salt`).digest('hex');
  const code = hash.substring(0, 8).toUpperCase();
  return code;
};

/**
 * 从邀请码解析出用户 ID（需要查表，这里是简化处理）
 */
const resolveInviteCode = (code) => {
  // 邀请码无法反向解析，需要后端维护映射表
  // 这里提供一个查询接口，前端调用获取邀请人信息
  return null;
};

// 邀请码映射表（内存缓存，生产环境应存数据库）
const inviteCodeMap = new Map();

/**
 * 获取用户的邀请码
 */
router.get('/invite-code', (req, res) => {
  try {
    const userId = req.query.userId || req.userId;
    
    if (!userId) {
      return response.badRequest(res, '缺少用户ID');
    }

    // 检查是否已有邀请码
    let inviteCode = inviteCodeMap.get(String(userId));
    if (!inviteCode) {
      inviteCode = generateInviteCode(userId);
      inviteCodeMap.set(String(userId), inviteCode);
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        inviteCode,
        userId: String(userId)
      }
    });
  } catch (error) {
    logger.error('获取邀请码失败:', error);
    response.error(res, '获取邀请码失败');
  }
});

/**
 * 根据邀请码查询邀请人信息
 */
router.get('/invite-info', (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return response.badRequest(res, '缺少邀请码');
    }

    // 查找邀请码对应的用户
    let foundUserId = null;
    for (const [uid, c] of inviteCodeMap.entries()) {
      if (c === code.toUpperCase()) {
        foundUserId = uid;
        break;
      }
    }

    if (!foundUserId) {
      return response.notFound(res, '邀请码无效');
    }

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        inviteCode: code.toUpperCase(),
        userId: foundUserId
      }
    });
  } catch (error) {
    logger.error('查询邀请信息失败:', error);
    response.error(res, '查询邀请信息失败');
  }
});

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
      response.error(res, '二维码生成失败');
    }
  } catch (error) {
    logger.error('生成二维码失败:', error);
    response.error(res, '二维码生成失败');
  }
});

router.get('/qrcode', (req, res) => {
  try {
    const { text, width = 200, margin = 4 } = req.query;
    
    if (!text) {
      return response.badRequest(res, '缺少必要参数 text');
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
      response.error(res, '二维码生成失败');
    }
  } catch (error) {
    logger.error('生成二维码失败:', error);
    response.error(res, '二维码生成失败');
  }
});

module.exports = router;