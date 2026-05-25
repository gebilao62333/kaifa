const { circleService } = require('../services');
const response = require('../utils/response');

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
    console.error('发布帖子错误:', error);
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
    response.success(res, result);
  } catch (error) {
    console.error('获取帖子列表错误:', error);
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
    response.success(res, result);
  } catch (error) {
    console.error('获取帖子详情错误:', error);
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
    console.error('解锁帖子错误:', error);
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
    console.error('获取我的帖子错误:', error);
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
    console.error('点赞帖子错误:', error);
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
    console.error('评论帖子错误:', error);
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
    console.error('获取评论列表错误:', error);
    response.error(res, error.message);
  }
};

const getTags = async (req, res) => {
  try {
    const result = await circleService.getTags();
    response.success(res, result);
  } catch (error) {
    console.error('获取话题列表错误:', error);
    response.error(res, error.message);
  }
};

const getAdminPosts = async (req, res) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query;
    
    const mockPosts = [
      {
        id: 1,
        user_id: 1001,
        nickname: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1001',
        content: '今天打王者荣耀赢了好多场，太开心了！',
        images: ['https://picsum.photos/400/300?random=1'],
        like_count: 128,
        comment_count: 32,
        status: 0,
        visibility: 0,
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        user_id: 1002,
        nickname: '李四',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1002',
        content: '英雄联盟新赛季开始了，有没有一起开黑的？',
        images: ['https://picsum.photos/400/300?random=2'],
        like_count: 256,
        comment_count: 64,
        status: 0,
        visibility: 0,
        create_time: '2024-01-01 11:00:00'
      },
      {
        id: 3,
        user_id: 1003,
        nickname: '王五',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1003',
        content: '分享一个绝地求生的吃鸡小技巧',
        images: ['https://picsum.photos/400/300?random=3'],
        like_count: 512,
        comment_count: 128,
        status: 1,
        visibility: 0,
        create_time: '2024-01-01 12:00:00'
      }
    ];
    
    let filtered = [...mockPosts];
    
    if (keyword) {
      filtered = filtered.filter(p => p.content.includes(keyword) || p.nickname.includes(keyword));
    }
    
    if (status !== undefined && status !== '') {
      filtered = filtered.filter(p => p.status === parseInt(status));
    }
    
    const total = filtered.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const end = start + parseInt(pageSize);
    const list = filtered.slice(start, end);
    
    response.success(res, {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });
  } catch (error) {
    console.error('获取管理帖子列表错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostDetail,
  unlockPost,
  getMyPosts,
  likePost,
  commentPost,
  getComments,
  getTags,
  getAdminPosts
};
