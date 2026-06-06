const albumService = require('../services/albumService');
const logger = require('../utils/logger');
const response = require('../utils/response');

const getPhotos = async (req, res) => {
  try {
    const { page = 1, pageSize = 12 } = req.query;
    const result = await albumService.getPhotos(req.userId, parseInt(page), parseInt(pageSize));
    response.success(res, result);
  } catch (error) {
    logger.error('获取相册错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return response.badRequest(res, '请选择要上传的图片');
    }

    const { description, privacy } = req.body;
    const result = await albumService.uploadPhoto(req.userId, req.file, description, privacy);
    response.success(res, result, '上传成功');
  } catch (error) {
    logger.error('上传照片错误:', error);
    logger.error('请求参数错误:', error);
    logger.error('请求参数错误:', error);
    response.badRequest(res, '请求参数错误');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

module.exports = {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  likePhoto
};
