const albumService = require('../services/albumService');
const { cosSignedUrlService, levelService } = require('../services');
const { AlbumPhoto } = require('../models');
const response = require('../utils/response');
const logger = require('../utils/logger');
const { ALBUM_LIMIT_BASE, ALBUM_LIMIT_EXPANDED } = require('../utils/level');

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

// U-13：查看他人主页公开相册
const getUserPhotos = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    if (!targetUserId) return response.badRequest(res, '用户ID不能为空');
    const { page = 1, pageSize = 12 } = req.query;
    const result = await albumService.getUserPublicPhotos(
      targetUserId,
      req.userId,
      parseInt(page),
      parseInt(pageSize)
    );
    if (result && Array.isArray(result.list)) {
      result.list = await Promise.all(result.list.map(async (p) => {
        if (p.url) p.url = await cosSignedUrlService.getSignedAccessUrl(p.url);
        if (p.thumbnail) p.thumbnail = await cosSignedUrlService.getSignedAccessUrl(p.thumbnail);
        return p;
      }));
    }
    response.success(res, result);
  } catch (error) {
    logger.error('获取用户相册错误:', error);
    response.error(res, error.message);
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const { url, description, privacy, password, price } = req.body;

    if (!url) {
      return response.badRequest(res, '缺少图片地址');
    }

    // Lv.25 解锁相册扩容：未达等级只有基础额度
    const expanded = await levelService.canUse(req.userId, 'album_expand');
    const limit = expanded ? ALBUM_LIMIT_EXPANDED : ALBUM_LIMIT_BASE;
    const used = await AlbumPhoto.count({ where: { user_id: req.userId } });
    if (used >= limit) {
      return response.unprocessableEntity(
        res,
        `相册最多 ${limit} 张，Lv.25 可扩容至 ${ALBUM_LIMIT_EXPANDED} 张`,
        { album: [`当前 ${used} 张，已达上限 ${limit} 张`] }
      );
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
  getUserPhotos,
  uploadPhoto,
  deletePhoto,
  likePhoto
};
