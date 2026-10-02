const { circleService, cosSignedUrlService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

// 对动态中的媒体URL做COS访问签名（防盗刷），失败则原样返回
const signPostMedia = async (post) => {
  if (post && Array.isArray(post.images)) {
    post.images = await cosSignedUrlService.resolveUrls(post.images);
  }
  if (post && post.videos) {
    post.videos = await cosSignedUrlService.getSignedAccessUrl(post.videos);
  }
  return post;
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return response.badRequest(res, '缺少动态ID');
    }
    await circleService.deletePost(req.userId, parseInt(postId));
    response.success(res, null, '删除成功');
  } catch (error) {
    logger.error('删除动态错误:', error);
    response.badRequest(res, error.message);
  }
};

const createPost = async (req, res) => {
  try {
    const { content, images, videos, tagIds, location, visibility, password, price } = req.body;
    
    if (!content && (!images || images.length === 0) && !videos) {
      return response.badRequest(res, '内容不能为空');
    }
    
    const result = await circleService.createPost(
      req.userId,
      content,
      images || [],
      videos,
      tagIds || [],
      location || '',
      visibility ? parseInt(visibility) : 0,
      password || '',
      price ? parseFloat(price) : 0
    );
    response.created(res, result, '发布成功');
  } catch (error) {
    logger.error('发布帖子错误:', error);
    response.error(res, error.message);
  }
};

const getPosts = async (req, res) => {
  try {
    const { tagId, page = 1, pageSize = 20 } = req.query;
    const result = await circleService.getPosts(
      req.userId,
      tagId ? parseInt(tagId) : null,
      parseInt(page),
      parseInt(pageSize)
    );
    if (result && Array.isArray(result.list)) {
      result.list = await Promise.all(result.list.map(signPostMedia));
    }
    response.success(res, result);
  } catch (error) {
    logger.error('获取帖子列表错误:', error);
    response.error(res, error.message);
  }
};

const getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return response.badRequest(res, '帖子ID不能为空');
    }
    
    const result = await circleService.getPostDetail(req.userId, parseInt(id));
    await signPostMedia(result);
    response.success(res, result);
  } catch (error) {
    logger.error('获取帖子详情错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const unlockPost = async (req, res) => {
  try {
    const { postId, unlockType, password } = req.body;
    
    if (!postId) {
      return response.badRequest(res, '帖子ID不能为空');
    }
    
    await circleService.unlockPost(
      req.userId,
      parseInt(postId),
      parseInt(unlockType) || 2,
      password
    );
    response.success(res, {}, '解锁成功');
  } catch (error) {
    logger.error('解锁帖子错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getMyPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await circleService.getMyPosts(
      req.userId,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取我的帖子错误:', error);
    response.error(res, error.message);
  }
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return response.badRequest(res, '帖子ID不能为空');
    }
    
    const result = await circleService.likePost(req.userId, parseInt(postId));
    response.success(res, result, result.isLiked ? '点赞成功' : '取消点赞');
  } catch (error) {
    logger.error('点赞帖子错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const commentPost = async (req, res) => {
  try {
    const { postId, content, replyId } = req.body;
    
    if (!postId || !content) {
      return response.badRequest(res, '帖子ID和评论内容不能为空');
    }
    
    const result = await circleService.commentPost(
      req.userId,
      parseInt(postId),
      content,
      replyId ? parseInt(replyId) : 0
    );
    response.created(res, result, '评论成功');
  } catch (error) {
    logger.error('评论帖子错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getComments = async (req, res) => {
  try {
    const { postId, page = 1, pageSize = 20 } = req.query;
    
    if (!postId) {
      return response.badRequest(res, '帖子ID不能为空');
    }
    
    const result = await circleService.getComments(
      parseInt(postId),
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取评论列表错误:', error);
    response.error(res, error.message);
  }
};

const getTags = async (req, res) => {
  try {
    const result = await circleService.getTags();
    response.success(res, result);
  } catch (error) {
    logger.error('获取话题列表错误:', error);
    response.error(res, error.message);
  }
};

const getAdminPosts = async (req, res) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query;
    const { Post, User } = require('../models');
    const { Op } = require('sequelize');

    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      where[Op.or] = [
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }

    try {
      const { count, rows } = await Post.findAndCountAll({
        where,
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        limit: parseInt(pageSize),
        order: [['create_time', 'DESC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'], required: false }]
      });

      const list = rows.map(p => ({
        id: p.id,
        user_id: p.user_id,
        nickname: p.author?.nickname || '未知用户',
        avatar: p.author?.avatar || '',
        content: p.content,
        images: p.images ? (Array.isArray(p.images) ? p.images : JSON.parse(p.images)) : [],
        like_count: p.like_count || p.likeCount || 0,
        comment_count: p.comment_count || p.commentCount || 0,
        status: p.status,
        visibility: p.visibility || p.visibility_type || 0,
        create_time: p.create_time || p.createdAt || new Date().toISOString()
      }));

      response.success(res, {
        list,
        pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
      });
    } catch (dbErr) {
      logger.error('[DB] Post 查询失败:', dbErr.message);
      response.error(res, '数据库查询失败，请稍后重试');
    }
  } catch (error) {
    logger.error('获取管理帖子列表错误:', error);
    response.error(res, error.message);
  }
};

const sharePost = async (req, res) => {
  try {
    // 检查分享功能是否开启
    try {
      const { SystemSettings } = require('../models');
      const setting = await SystemSettings.findOne({ where: { key: 'shareEnabled' } });
      if (setting && setting.value === 'false') {
        return response.badRequest(res, '分享功能已关闭');
      }
    } catch (e) {
      // 数据库不可用时允许通过
      logger.warn('检查分享设置失败，默认允许:', e.message);
    }

    const { postId } = req.body;
    if (!postId) {
      return response.badRequest(res, '帖子ID不能为空');
    }

    const { Post } = require('../models');

    try {
      const post = await Post.findByPk(parseInt(postId));
      if (!post) {
        return response.notFound(res, '帖子不存在');
      }
      post.share_num = (post.share_num || 0) + 1;
      await post.save();

      // 如果开启了分享奖励
      try {
        const { SystemSettings } = require('../models');
        const rewardEnabled = await SystemSettings.findOne({ where: { key: 'shareRewardEnabled' } });
        if (rewardEnabled && rewardEnabled.value === 'true') {
          const rewardAmount = await SystemSettings.findOne({ where: { key: 'shareRewardAmount' } });
          const amount = rewardAmount ? parseFloat(rewardAmount.value) || 0 : 0;
          if (amount > 0) {
            const { User } = require('../models');
            await User.increment('money', { by: amount, where: { id: req.userId } });
          }
        }
      } catch (e) {
        // 奖励发放失败不影响分享
        logger.warn('分享奖励发放失败:', e.message);
      }

      response.success(res, { shares: post.share_num }, '分享成功');
    } catch (dbErr) {
      logger.error('[DB] 分享帖子失败:', dbErr.message);
      response.error(res, '分享失败，请稍后重试');
    }
  } catch (error) {
    logger.error('分享帖子错误:', error);
    response.error(res, error.message);
  }
};

const repostPost = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    if (!postId) {
      return response.badRequest(res, '帖子ID不能为空');
    }

    const result = await circleService.repostPost(req.userId, parseInt(postId), comment || '');
    response.success(res, result, '转发成功');
  } catch (error) {
    logger.error('转发帖子错误:', error);
    response.badRequest(res, error.message);
  }
};

const getShareStatus = async (req, res) => {
  try {
    try {
      const { SystemSettings } = require('../models');
      const setting = await SystemSettings.findOne({ where: { key: 'shareEnabled' } });
      const rewardSetting = await SystemSettings.findOne({ where: { key: 'shareRewardEnabled' } });
      const amountSetting = await SystemSettings.findOne({ where: { key: 'shareRewardAmount' } });

      response.success(res, {
        shareEnabled: !setting || setting.value !== 'false',
        shareRewardEnabled: rewardSetting && rewardSetting.value === 'true',
        shareRewardAmount: amountSetting ? parseFloat(amountSetting.value) || 0 : 0
      });
    } catch (dbErr) {
      response.success(res, {
        shareEnabled: true,
        shareRewardEnabled: false,
        shareRewardAmount: 0
      });
    }
  } catch (error) {
    logger.error('获取分享状态错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostDetail,
  unlockPost,
  getMyPosts,
  deletePost,
  likePost,
  commentPost,
  getComments,
  getTags,
  getAdminPosts,
  sharePost,
  repostPost,
  getShareStatus
};
