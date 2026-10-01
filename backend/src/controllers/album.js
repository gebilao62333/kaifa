const albumService = require('../services/albumService');
const { cosSignedUrlService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

const getPhotos = async (req, res) => {
  try {
    const { page = 1, pageSize = 12 } = req.query;
    const result = await albumService.getPhotos(req.userId, parseInt(page), parseInt(pageSize));
    // 对相册图片做COS访问签名（防盗刷）
    if (result && Array.isArray(result.list)) {
      result.list = await Promise.all(result.list.map(async (p) => {
        if (p.url) p.url = await cosSignedUrlService.getSignedAccessUrl(p.url);
        if (p.thumbnail) p.thumbnail = await cosSignedUrlService.getSignedAccessUrl(p.thumbnail);
        return p;
      }));
    }
    response.success(res, result);
  } catch (error) {
    logger.error('获取相册错误:', error);
    response.error(res, error.message);
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const { url, description, privacy, password, price } = req.body;

    if (!url) {
      return response.badRequest(res, '缺少图片地址');
    }

    const result = await albumService.uploadPhoto(req.userId, url, description, privacy, password, price);
    response.success(res, result, '上传成功');
  } catch (error) {
    logger.error('上传照片错误:', error);
    response.badRequest(res, error.message);
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return response.badRequest(res, '照片ID不能为空');
    }

    await albumService.deletePhoto(req.userId, parseInt(id));
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除照片错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const likePhoto = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return response.badRequest(res, '照片ID不能为空');
    }

    const result = await albumService.likePhoto(req.userId, parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error('点赞照片错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

module.exports = {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  likePhoto
};
