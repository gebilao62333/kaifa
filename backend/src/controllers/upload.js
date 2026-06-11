const { uploadService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');
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
    response.badRequest(res, error.message || '图片上传失败');
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
    response.badRequest(res, error.message || '音频上传失败');
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
    response.badRequest(res, error.message || '视频上传失败');
  }
};

const getUploadToken = async (req, res) => {
  try {
    const token = await uploadService.getUploadToken();
    response.success(res, token, '获取上传凭证成功');
  } catch (error) {
    logger.error('获取上传凭证错误:', error.message);
    response.error(res, error.message || '获取上传凭证失败');
  }
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo,
  getUploadToken
};
