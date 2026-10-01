const { Post, PostLike, PostComment, PostUnlock, User, UserFollow } = require('../models');
const mediaAssetService = require('./mediaAssetService');
const { getTimestamp, parseQuery } = require('../utils/helper');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const crypto = require('crypto');

// 兼容逗号分隔字符串和 JSON 数组两种 images 存储格式
const parseImages = (raw) => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try { const arr = JSON.parse(trimmed); return Array.isArray(arr) ? arr.filter(Boolean) : []; } catch {}
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return [];
};

const createPost = async (userId, content, images, videos, tagIds, location, visibility, password, price) => {
  const post = await Post.create({
    user_id: userId,
    content,
    images: images ? images.join(',') : '',
    videos: videos || '',
    tag_id: tagIds && tagIds.length > 0 ? tagIds[0] : 0,
    tag_ids: tagIds ? JSON.stringify(tagIds) : null,
    location: location || '',
    visibility: visibility || 0,
    password: password ? crypto.createHash('md5').update(password).digest('hex') : null,
    price: price || 0,
    is_private: visibility === 3 ? 1 : (visibility === 4 ? 2 : 0),
    private_password: visibility === 3 ? crypto.createHash('md5').update(password).digest('hex') : null,
    private_price: visibility === 4 ? price : 0,
    create_time: getTimestamp()
  });

  // 登记媒体资，供 deletePost 级联清理底层存储，避免 COS 孤儿文件
  const mediaItems = [];
  (images || []).forEach(url => mediaItems.push({ userId, url, fileType: 'image', bizType: 'circle', bizId: post.id }));
  if (videos) mediaItems.push({ userId, url: videos, fileType: 'video', bizType: 'circle', bizId: post.id });
  if (mediaItems.length) {
    try {
      await mediaAssetService.registerBatch(mediaItems);
    } catch (e) {
      logger.error('[动态] 登记媒资失败:', e.message);
    }
  }

  return {
    postId: post.id
  };
};

const repostPost = async (userId, repostId, comment = '') => {
  // 找原帖
  const original = await Post.findByPk(repostId);
  if (!original) throw new Error('原帖不存在或已删除');
  if (original.is_private === 1) throw new Error('不能转发私密帖子');

  // 创建转发帖子
  const post = await Post.create({
    user_id: userId,
    content: comment || '转发动态',
    repost_id: repostId,
    create_time: getTimestamp(),
    status: 1
  });

  // 原帖分享数 +1
  await Post.increment('share_num', { by: 1, where: { id: repostId } });

  return { postId: post.id, repostId };
};

const getPosts = async (userId, tagId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const where = {
    status: 1,
    is_private: 0
  };
  
  if (tagId) {
    where.tag_id = tagId;
  }
  
  const { count, rows } = await Post.findAndCountAll({
    where,
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  const posts = await Promise.all(rows.map(async (post) => {
    const author = await User.findByPk(post.user_id);
    const isLiked = userId ? await PostLike.findOne({
      where: { post_id: post.id, user_id: userId }
    }) : false;

    // 如果是转发贴，获取原帖信息
    let repostInfo = {};
    if (post.repost_id && post.repost_id > 0) {
      try {
        const original = await Post.findByPk(post.repost_id);
        if (original) {
          const originalAuthor = await User.findByPk(original.user_id);
          repostInfo = {
            repostId: post.repost_id,
            repostContent: original.content || '',
            repostNickname: originalAuthor?.nickname || '',
            repostUserId: original.user_id
          };
        }
      } catch (e) {
        // 原帖可能已删除
      }
    }
    
    return {
      postId: post.id,
      userId: post.user_id,
      nickname: author?.nickname || '',
      avatar: author?.avatar || '',
      level: author?.lv || 1,
      content: post.content,
      images: parseImages(post.images),
      videos: post.videos || '',
      likes: post.thumb_num,
      comments: post.comment_num,
      shares: post.share_num,
      repostId: post.repost_id || 0,
      repostContent: repostInfo.repostContent || '',
      repostNickname: repostInfo.repostNickname || '',
      tagId: post.tag_id,
      type: post.type,
      isLiked: !!isLiked,
      createTime: post.create_time
    };
  }));
  
  return {
    total: count,
    list: posts
  };
};

// 关键词搜索公开动态（仅 status=1 且非私密），按时间倒序
const searchPosts = async (userId, keyword, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const kw = String(keyword || '').trim();
  if (!kw) {
    return { total: 0, list: [] };
  }

  const { count, rows } = await Post.findAndCountAll({
    where: {
      status: 1,
      is_private: 0,
      visibility: 0,
      content: { [Op.like]: `%${kw}%` }
    },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });

  const posts = await Promise.all(rows.map(async (post) => {
    const author = await User.findByPk(post.user_id);
    return {
      postId: post.id,
      userId: post.user_id,
      nickname: author?.nickname || '',
      avatar: author?.avatar || '',
      content: post.content,
      images: parseImages(post.images),
      videos: post.videos || '',
      likes: post.thumb_num,
      comments: post.comment_num,
      createTime: post.create_time
    };
  }));

  return { total: count, list: posts };
};

const getPostDetail = async (userId, postId) => {
  const post = await Post.findByPk(postId);
  
  if (!post) {
    throw new Error('帖子不存在');
  }
  
  if (post.is_private === 1 || post.is_private === 2) {
    if (post.user_id !== userId) {
      const unlock = await PostUnlock.findOne({
        where: { post_id: postId, user_id: userId }
      });
      
      if (!unlock) {
        return {
          postId: post.id,
          isPrivate: true,
          privateType: post.is_private,
          privatePrice: post.private_price,
          locked: true
        };
      }
    }
  }
  
  const author = await User.findByPk(post.user_id);
  const isLiked = userId ? await PostLike.findOne({
    where: { post_id: postId, user_id: userId }
  }) : false;
  
  return {
    postId: post.id,
    userId: post.user_id,
    nickname: author?.nickname || '',
    avatar: author?.avatar || '',
    level: author?.lv || 1,
    content: post.content,
    images: post.images ? post.images.split(',').filter(Boolean) : [],
    videos: post.videos || '',
    likes: post.thumb_num,
    comments: post.comment_num,
    shares: post.share_num,
    tagId: post.tag_id,
    type: post.type,
    isLiked: !!isLiked,
    createTime: post.create_time,
    locked: false
  };
};

const unlockPost = async (userId, postId, unlockType, password) => {
  const post = await Post.findByPk(postId);
  
  if (!post) {
    throw new Error('帖子不存在');
  }
  
  if (post.is_private === 0) {
    throw new Error('帖子不需要解锁');
  }
  
  const existing = await PostUnlock.findOne({
    where: { post_id: postId, user_id: userId }
  });
  
  if (existing) {
    throw new Error('已解锁过该帖子');
  }
  
  if (post.is_private === 1) {
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    if (hashedPassword !== post.private_password) {
      throw new Error('密码错误');
    }
  }
  
  if (post.is_private === 2) {
    const user = await User.findByPk(userId);
    if (Number(user.money) < post.private_price) {
      throw new Error('虚拟币不足');
    }
    
    await User.decrement('money', {
      by: post.private_price,
      where: { id: userId }
    });
    
    await User.increment('money', {
      by: post.private_price,
      where: { id: post.user_id }
    });
  }
  
  await PostUnlock.create({
    post_id: postId,
    user_id: userId,
    price: post.private_price,
    create_time: getTimestamp()
  });
  
  return true;
};

const getMyPosts = async (userId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const { count, rows } = await Post.findAndCountAll({
    where: { user_id: userId },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  const posts = rows.map(post => ({
    postId: post.id,
    content: post.content,
    images: post.images ? post.images.split(',').filter(Boolean) : [],
    videos: post.videos || '',
    likes: post.thumb_num,
    comments: post.comment_num,
    createTime: post.create_time
  }));
  
  return {
    total: count,
    list: posts
  };
};

const likePost = async (userId, postId) => {
  const post = await Post.findByPk(postId);
  
  if (!post) {
    throw new Error('帖子不存在');
  }
  
  const existing = await PostLike.findOne({
    where: { post_id: postId, user_id: userId }
  });
  
  if (existing) {
    await existing.destroy();
    await post.decrement('thumb_num');
    return { isLiked: false };
  }
  
  await PostLike.create({
    post_id: postId,
    user_id: userId,
    create_time: getTimestamp()
  });
  
  await post.increment('thumb_num');
  
  return { isLiked: true };
};

const commentPost = async (userId, postId, content, replyId) => {
  const post = await Post.findByPk(postId);
  
  if (!post) {
    throw new Error('帖子不存在');
  }
  
  const comment = await PostComment.create({
    post_id: postId,
    user_id: userId,
    content,
    reply_id: replyId || 0,
    reply_user_id: replyId ? (await PostComment.findByPk(replyId))?.user_id : 0,
    create_time: getTimestamp()
  });
  
  await post.increment('comment_num');
  
  return {
    commentId: comment.id
  };
};

const getComments = async (postId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const { count, rows } = await PostComment.findAndCountAll({
    where: { post_id: postId },
    offset,
    limit,
    order: [['create_time', 'ASC']]
  });
  
  const comments = await Promise.all(rows.map(async (comment) => {
    const user = await User.findByPk(comment.user_id);
    let replyUser = null;
    
    if (comment.reply_user_id) {
      const reply = await User.findByPk(comment.reply_user_id);
      replyUser = {
        userId: reply?.id,
        nickname: reply?.nickname || ''
      };
    }
    
    return {
      commentId: comment.id,
      userId: comment.user_id,
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
      content: comment.content,
      replyId: comment.reply_id,
      replyUser,
      createTime: comment.create_time
    };
  }));
  
  return {
    total: count,
    list: comments
  };
};

const getTags = async () => {
  return [];
};

// 删除动态：同时级联清理底层存储（COS/本地）与媒资登记，避免孤儿文件
const deletePost = async (userId, postId) => {
  const post = await Post.findOne({ where: { id: postId, user_id: userId } });

  if (!post) {
    throw new Error('动态不存在或无权删除');
  }

  try {
    await mediaAssetService.removeByBiz('circle', postId);
  } catch (e) {
    logger.error('[动态] 清理媒资失败:', e.message);
  }

  await post.destroy();
  return true;
};

module.exports = {
  createPost,
  repostPost,
  getPosts,
  searchPosts,
  getPostDetail,
  unlockPost,
  getMyPosts,
  deletePost,
  likePost,
  commentPost,
  getComments,
  getTags
};
