const { uploadService, mediaAssetService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');
const path = require('path');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return response.badRequest(res, '请选择要上传的图片');
    }
    
    const result = await uploadService.uploadImage(req.file);
    response.success(res, result, '上传成功');
  } catch (error) {
    logger.error('上传图片错误:', error);
    response.badRequest(res, error.message);
  }
};

const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return response.badRequest(res, '请选择要上传的音频');
    }
    
    const result = await uploadService.uploadAudio(req.file);
    response.success(res, result, '上传成功');
  } catch (error) {
    logger.error('上传音频错误:', error);
    response.badRequest(res, error.message);
  }
};

const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return response.badRequest(res, '请选择要上传的视频');
    }
    
    const result = await uploadService.uploadVideo(req.file);
    response.success(res, result, '上传成功');
  } catch (error) {
    logger.error('上传视频错误:', error);
    response.badRequest(res, error.message);
  }
};

// 前端直传：返回 COS 预签名 PUT URL，前端据此直传，绕过后端文件流中转
const getUploadToken = async (req, res) => {
  try {
    const { type = 'file', ext = '' } = req.query;
    const token = await uploadService.getDirectUploadToken(type, ext);

    if (!token) {
      return response.badRequest(res, 'COS未配置，无法直传');
    }

    response.success(res, token, '获取上传凭证成功');
  } catch (error) {
    logger.error('获取上传凭证错误:', error);
    response.badRequest(res, error.message);
  }
};

// 前端直传完成后回传访问 URL，由后端持久化到统一媒资表（只存 URL 索引，可审计/可级联删除）
const registerUpload = async (req, res) => {
  try {
    const { url, type, bizType = 'misc', storage = 'cos' } = req.body;

    if (!url) {
      return response.badRequest(res, '缺少文件访问地址');
    }

    const asset = await mediaAssetService.register({
      userId: req.userId,
      url,
      fileType: type || 'file',
      bizType,
      storage
    });

    response.success(res, { assetId: asset.id, url, type }, '文件已登记');
  } catch (error) {
    logger.error('登记上传错误:', error);
    response.badRequest(res, error.message);
  }
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  getUploadToken,
  registerUpload
};
