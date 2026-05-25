const { uploadService } = require('../services');
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
    console.error('上传图片错误:', error);
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
    console.error('上传音频错误:', error);
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
    console.error('上传视频错误:', error);
    response.badRequest(res, error.message);
  }
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadVideo
};
