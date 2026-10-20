const { Post, PostLike, PostComment, PostUnlock, User, UserFollow } = require('../models');
const mediaAssetService = require('./mediaAssetService');
const notificationCenterService = require('./notificationCenterService');
const levelService = require('./levelService');
const { getTimestamp, parseQuery } = require('../utils/helper');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/mysql');
const bcrypt = require('bcryptjs');
const { moneyMinus } = require('../utils/sql');

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

// videos 列是 STRING：前端可能传数组（无视频时为 []）或字符串。
// 不能直接用 `videos || ''`——空数组是 truthy，会被 Sequelize 以
// "string violation: videos cannot be an array or an object" 拒绝并抛出 500。
const normalizeVideos = (raw) => {
  if (!raw) return '';
  if (Array.isArray(raw)) return raw.filter(Boolean).join(',');
  return String(raw);
};

// ===== 动态可见范围（前后端唯一口径）=====
// C 端 visibility：0 公开 / 1 仅关注 / 2 私密 / 3 密码查看 / 4 付费查看
// 落库 xn_post.is_private：0 公开 / 1 密码 / 2 付费 / 3 仅关注 / 4 私密
// 1/2 沿用历史值，3/4 为新增语义（Post.is_private 是 TINYINT，追加值不需要改表结构）。
const VISIBILITY = Object.freeze({ PUBLIC: 0, FRIENDS: 1, PRIVATE: 2, PASSWORD: 3, PAY: 4 });
const PRIVATE_FLAG = Object.freeze({ PUBLIC: 0, PASSWORD: 1, PAY: 2, FRIENDS: 3, PRIVATE: 4 });

const toPrivateFlag = (visibility) => {
  switch (Number(visibility)) {
    case VISIBILITY.FRIENDS: return PRIVATE_FLAG.FRIENDS;
    case VISIBILITY.PRIVATE: return PRIVATE_FLAG.PRIVATE;
    case VISIBILITY.PASSWORD: return PRIVATE_FLAG.PASSWORD;
    case VISIBILITY.PAY: return PRIVATE_FLAG.PAY;
    default: return PRIVATE_FLAG.PUBLIC;
  }
};

const isFollowing = async (followerId, followingId) => {
  if (!followerId || !followingId) return false;
  try {
    const row = await UserFollow.findOne({
      where: { follower_id: followerId, following_id: followingId }
    });
    return !!row;
  } catch (e) {
    return false;
  }
};

// 列表/搜索可见范围：公开动态 + 自己的仅关注/私密动态 + 已关注作者的仅关注动态
const buildVisibilityWhere = async (viewerId) => {
  const or = [{ is_private: PRIVATE_FLAG.PUBLIC }];
  if (viewerId) {
    or.push({
      user_id: viewerId,
      is_private: { [Op.in]: [PRIVATE_FLAG.FRIENDS, PRIVATE_FLAG.PRIVATE] }
    });
    let rows = [];
    try {
      rows = await UserFollow.findAll({
        where: { follower_id: viewerId },
        attributes: ['following_id'],
        raw: true
      });
    } catch (e) {
      rows = [];
    }
    const followingIds = (rows || []).map(row => row.following_id).filter(Boolean);
    if (followingIds.length > 0) {
      or.push({
        is_private: PRIVATE_FLAG.FRIENDS,
        user_id: { [Op.in]: followingIds }
      });
    }
  }
  return { [Op.or]: or };
};

// 评论等附属资源：密码/付费帖需已解锁；仅关注/私密按作者与关注关系判断
const canViewPost = async (post, viewerId) => {
  if (!post) return false;
  const privateFlag = Number(post.is_private) || PRIVATE_FLAG.PUBLIC;
  if (privateFlag === PRIVATE_FLAG.PUBLIC) return true;
  if (viewerId && String(post.user_id) === String(viewerId)) return true;
  if (privateFlag === PRIVATE_FLAG.FRIENDS) {
    return isFollowing(viewerId, post.user_id);
  }
  if (privateFlag === PRIVATE_FLAG.PASSWORD || privateFlag === PRIVATE_FLAG.PAY) {
    if (!viewerId) return false;
    const unlock = await PostUnlock.findOne({
      where: { post_id: post.id, user_id: viewerId }
    });
    return !!unlock;
  }
  return false;
};

const createPost = async (userId, content, images, videos, tagIds, location, visibility, password, price) => {
  // 仅写入模型实际存在的列；visibility 映射为 is_private/private_password/private_price
  const post = await Post.create({
    user_id: userId,
    content,
    images: Array.isArray(images) ? images.filter(Boolean).join(',') : (images || ''),
    videos: normalizeVideos(videos),
    tag_id: tagIds && tagIds.length > 0 ? tagIds[0] : 0,
    is_private: toPrivateFlag(visibility),
    // 审计 M8：私密帖密码原先用 MD5（可被彩虹表/暴力破解），改为 bcrypt
    private_password: (visibility === 3 && password)
      ? await bcrypt.hash(String(password), 10)
      : null,
    private_price: visibility === 4 ? (price || 0) : 0,
    create_time: getTimestamp()
  });

  // 登记媒体资，供 deletePost 级联清理底层存储，避免 COS 孤儿文件
  const imageList = Array.isArray(images) ? images.filter(Boolean) : (images ? String(images).split(',').filter(Boolean) : []);
  const videoList = Array.isArray(videos) ? videos.filter(Boolean) : (videos ? String(videos).split(',').filter(Boolean) : []);
  const mediaItems = [];
  imageList.forEach(url => mediaItems.push({ userId, url, fileType: 'image', bizType: 'circle', bizId: post.id }));
  videoList.forEach(url => mediaItems.push({ userId, url, fileType: 'video', bizType: 'circle', bizId: post.id }));
  if (mediaItems.length) {
    try {
      await mediaAssetService.registerBatch(mediaItems);
    } catch (e) {
      logger.error('[动态] 登记媒资失败:', e.message);
    }
  }

  // 经验来源：发布动态 +20。经验是附属副作用，失败不能影响发帖。
  try {
    await levelService.addExp(userId, 'post_created');
  } catch (e) {
    logger.error('[动态] 记录发布经验失败:', e.message);
  }

  return {
    postId: post.id
  };
};

const repostPost = async (userId, repostId, comment = '') => {  // 找原帖
  const original = await Post.findByPk(repostId);
  if (!original) throw new Error('原帖不存在或已删除');
  // 仅公开动态可转发：密码/付费/仅关注/私密一律拦截，避免把私密内容扩散出去
  if (Number(original.is_private) !== PRIVATE_FLAG.PUBLIC) throw new Error('不能转发私密帖子');

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
    ...(await buildVisibilityWhere(userId))
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
      ...(await buildVisibilityWhere(userId)),
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
  
  const privateFlag = Number(post.is_private) || PRIVATE_FLAG.PUBLIC;

  // 密码/付费：未解锁只返回锁定占位（可解锁）
  if (privateFlag === PRIVATE_FLAG.PASSWORD || privateFlag === PRIVATE_FLAG.PAY) {
    if (String(post.user_id) !== String(userId)) {
      const unlock = await PostUnlock.findOne({
        where: { post_id: postId, user_id: userId }
      });
      if (!unlock) {
        return {
          postId: post.id,
          isPrivate: true,
          privateType: privateFlag,
          privatePrice: post.private_price,
          locked: true
        };
      }
    }
  }

  // 仅关注：非作者且未关注作者时只返回锁定占位（不支持解锁）
  if (privateFlag === PRIVATE_FLAG.FRIENDS) {
    if (String(post.user_id) !== String(userId) && !(await isFollowing(userId, post.user_id))) {
      return {
        postId: post.id,
        isPrivate: true,
        privateType: PRIVATE_FLAG.FRIENDS,
        privatePrice: 0,
        locked: true
      };
    }
  }

  // 私密：仅作者本人可见
  if (privateFlag === PRIVATE_FLAG.PRIVATE && String(post.user_id) !== String(userId)) {
    return {
      postId: post.id,
      isPrivate: true,
      privateType: PRIVATE_FLAG.PRIVATE,
      privatePrice: 0,
      locked: true
    };
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
    repostId: post.repost_id || 0,
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
  
  if (Number(post.is_private) === PRIVATE_FLAG.PUBLIC) {
    throw new Error('帖子不需要解锁');
  }

  if (Number(post.is_private) === PRIVATE_FLAG.FRIENDS || Number(post.is_private) === PRIVATE_FLAG.PRIVATE) {
    throw new Error('该动态不支持解锁');
  }
  
  const existing = await PostUnlock.findOne({
    where: { post_id: postId, user_id: userId }
  });
  
  if (existing) {
    throw new Error('已解锁过该帖子');
  }
  
  if (post.is_private === 1) {
    const stored = String(post.private_password || '');
    let matched = false;

    if (stored.startsWith('$2')) {
      matched = await bcrypt.compare(String(password), stored);
    } else if (stored) {
      // 兼容历史 MD5 记录：校验通过后顺手升级为 bcrypt，避免继续沿用弱哈希
      matched = crypto.createHash('md5').update(String(password)).digest('hex') === stored;
      if (matched) {
        try {
          await post.update({ private_password: await bcrypt.hash(String(password), 10) });
        } catch (upgradeError) {
          logger.warn('[动态] 私密帖密码升级 bcrypt 失败:', upgradeError.message);
        }
      }
    }

    if (!matched) {
      throw new Error('密码错误');
    }
  }

  // 事务内先写解锁记录（唯一键 post_id+user_id 拦截并发重复解锁），再执行扣费
  const transaction = await sequelize.transaction();
  try {
    await PostUnlock.create({
      post_id: postId,
      user_id: userId,
      price: post.private_price,
      create_time: getTimestamp()
    }, { transaction });

    if (post.is_private === 2) {
      // 原子扣款：余额不足则不扣并回滚（连同上面的解锁记录）
      const [affected] = await User.update(
        { money: moneyMinus('money', post.private_price) },
        { where: { id: userId, money: { [Op.gte]: post.private_price } }, transaction }
      );
      if (!affected) {
        throw new Error('虚拟币不足');
      }

      await User.increment('money', {
        by: post.private_price,
        where: { id: post.user_id },
        transaction
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('已解锁过该帖子');
    }
    throw error;
  }

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
    shares: post.share_num,
    // 0/未设置按已发布处理；2 为未通过，其余（1）为已发布
    status: Number(post.status) === 2 ? 'rejected' : (Number(post.status) === 0 ? 'review' : 'published'),
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
  // U-12：给作者写一条点赞互动通知（自己赞自己不通知）
  if (Number(post.user_id) !== Number(userId)) {
    try {
      const liker = await User.findByPk(userId);
      await notificationCenterService.create(
        post.user_id,
        'like',
        '收到赞',
        `${liker?.nickname || '有人'} 赞了你的动态`,
        { postId: Number(postId) }
      );
    } catch (e) { /* 通知失败不影响点赞 */ }
  }
  
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
  // U-12：评论通知作者；回复时额外通知被回复人
  try {
    const commenter = await User.findByPk(userId);
    const name = commenter?.nickname || '有人';
    if (Number(post.user_id) !== Number(userId)) {
      await notificationCenterService.create(
        post.user_id,
        'comment',
        '收到评论',
        `${name} 评论了你的动态：${String(content).slice(0, 50)}`,
        { postId: Number(postId), commentId: comment.id }
      );
    }
    if (comment.reply_user_id && Number(comment.reply_user_id) !== Number(userId)) {
      await notificationCenterService.create(
        comment.reply_user_id,
        'comment',
        '收到回复',
        `${name} 回复了你：${String(content).slice(0, 50)}`,
        { postId: Number(postId), commentId: comment.id }
      );
    }
  } catch (e) { /* 通知失败不影响评论 */ }
  
  return {
    commentId: comment.id
  };
};

const getComments = async (userId, postId, page, pageSize) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new Error('帖子不存在');
  if (!(await canViewPost(post, userId))) throw new Error('无权查看该动态评论');

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
