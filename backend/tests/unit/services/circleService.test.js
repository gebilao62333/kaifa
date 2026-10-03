jest.mock('../../../src/models', () => {
  const model = () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    increment: jest.fn()
  });
  return {
    Post: model(), PostLike: model(), PostComment: model(),
    PostUnlock: model(), User: model(), UserFollow: model()
  };
});
jest.mock('../../../src/services/mediaAssetService', () => ({
  registerBatch: jest.fn(),
  removeByBiz: jest.fn()
}));
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn(), literal: jest.fn((s) => s) }));

const bcrypt = require('bcryptjs');
const circleService = require('../../../src/services/circleService');
const { Post, PostLike, PostComment, PostUnlock, User } = require('../../../src/models');
const mediaAssetService = require('../../../src/services/mediaAssetService');
const sequelize = require('../../../src/config/mysql');

const txn = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) });

describe('Service - CircleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(txn());
    mediaAssetService.registerBatch.mockResolvedValue(true);
    mediaAssetService.removeByBiz.mockResolvedValue(true);
  });

  describe('createPost', () => {
    it('creates a public post and registers media', async () => {
      Post.create.mockResolvedValue({ id: 1 });
      const result = await circleService.createPost(2, 'hello', ['a.jpg', 'b.jpg'], 'v.mp4', [3], 'loc', 0);
      expect(result).toEqual({ postId: 1 });
      expect(mediaAssetService.registerBatch).toHaveBeenCalled();
      expect(Post.create.mock.calls[0][0].images).toBe('a.jpg,b.jpg');
    });

    it('creates a password-protected post（密码用 bcrypt 存储）', async () => {
      Post.create.mockResolvedValue({ id: 2 });
      await circleService.createPost(2, 'secret', null, null, null, null, 3, 'pw123');
      const data = Post.create.mock.calls[0][0];
      expect(data.is_private).toBe(1);
      // 审计 M8：MD5(32 位) 改为 bcrypt(60 位)
      expect(data.private_password).toHaveLength(60);
      expect(data.private_password.startsWith('$2')).toBe(true);
      await expect(bcrypt.compare('pw123', data.private_password)).resolves.toBe(true);
      expect(data.images).toBe('');
    });

    it('creates a paid post', async () => {
      Post.create.mockResolvedValue({ id: 3 });
      await circleService.createPost(2, 'paid', [], '', [], '', 4, null, 50);
      const data = Post.create.mock.calls[0][0];
      expect(data.is_private).toBe(2);
      expect(data.private_price).toBe(50);
    });

    it('swallows media registration failures', async () => {
      Post.create.mockResolvedValue({ id: 4 });
      mediaAssetService.registerBatch.mockRejectedValue(new Error('cos down'));
      await expect(circleService.createPost(2, 'x', ['a.jpg'])).resolves.toEqual({ postId: 4 });
    });
  });

  describe('repostPost', () => {
    it('rejects missing and private originals', async () => {
      Post.findByPk.mockResolvedValue(null);
      await expect(circleService.repostPost(2, 1)).rejects.toThrow('原帖不存在或已删除');

      Post.findByPk.mockResolvedValue({ id: 1, is_private: 1 });
      await expect(circleService.repostPost(2, 1)).rejects.toThrow('不能转发私密帖子');
    });

    it('reposts and increments share count', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, is_private: 0 });
      Post.create.mockResolvedValue({ id: 9 });
      Post.increment.mockResolvedValue([1]);
      const result = await circleService.repostPost(2, 1, 'nice');
      expect(result).toEqual({ postId: 9, repostId: 1 });
      expect(Post.increment).toHaveBeenCalled();
    });
  });

  describe('getPosts', () => {
    it('maps posts including repost details', async () => {
      Post.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: 1, user_id: 2, content: 'c1', images: '["a.jpg","b.jpg"]', repost_id: 5, thumb_num: 1, comment_num: 2, share_num: 3, tag_id: 1, type: 0, create_time: 1 },
          { id: 2, user_id: 2, content: 'c2', images: 'a.jpg,,b.jpg', repost_id: 0, thumb_num: 0, comment_num: 0, share_num: 0, create_time: 2 }
        ]
      });
      Post.findByPk.mockImplementation((id) => {
        if (id === 5) return Promise.resolve({ id: 5, user_id: 3, content: 'orig' });
        return Promise.resolve({ id, user_id: 3, nickname: 'o' });
      });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n', avatar: 'a', lv: 2 });
      PostLike.findOne.mockResolvedValue({ id: 1 });

      const result = await circleService.getPosts(2, 1, 1, 10);
      expect(result.total).toBe(2);
      expect(result.list[0].images).toEqual(['a.jpg', 'b.jpg']);
      expect(result.list[0].repostContent).toBe('orig');
      expect(result.list[1].images).toEqual(['a.jpg', 'b.jpg']);
      expect(result.list[0].isLiked).toBe(true);
      expect(Post.findAndCountAll.mock.calls[0][0].where.tag_id).toBe(1);
    });

    it('handles anonymous visitors and missing originals', async () => {
      Post.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 1, user_id: 2, images: 'bad-json', repost_id: 7, create_time: 1 }]
      });
      Post.findByPk.mockResolvedValue(null);
      User.findByPk.mockResolvedValue(null);

      const result = await circleService.getPosts(null, null, 1, 10);
      expect(result.list[0].isLiked).toBe(false);
      expect(result.list[0].repostContent).toBe('');
      expect(result.list[0].images).toEqual(['bad-json']);
      expect(Post.findAndCountAll.mock.calls[0][0].where.tag_id).toBeUndefined();
    });
  });

  describe('searchPosts', () => {
    it('returns empty for blank keywords', async () => {
      expect(await circleService.searchPosts(2, '   ', 1, 10)).toEqual({ total: 0, list: [] });
      expect(await circleService.searchPosts(2, null, 1, 10)).toEqual({ total: 0, list: [] });
    });

    it('searches by keyword', async () => {
      Post.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 1, user_id: 2, content: 'match', images: 'a.jpg', videos: 'v', thumb_num: 1, comment_num: 1, create_time: 1 }]
      });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      const result = await circleService.searchPosts(2, 'match', 1, 10);
      expect(result.total).toBe(1);
      expect(result.list[0].nickname).toBe('n');
    });
  });

  describe('getPostDetail', () => {
    it('throws when missing', async () => {
      Post.findByPk.mockResolvedValue(null);
      await expect(circleService.getPostDetail(2, 1)).rejects.toThrow('帖子不存在');
    });

    it('locks private posts for non-owners', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, user_id: 3, is_private: 1, private_price: 10 });
      PostUnlock.findOne.mockResolvedValue(null);
      const result = await circleService.getPostDetail(2, 1);
      expect(result).toEqual({ postId: 1, isPrivate: true, privateType: 1, privatePrice: 10, locked: true });
    });

    it('returns unlocked private posts', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, user_id: 3, is_private: 2, private_price: 10, images: 'a.jpg', thumb_num: 1 });
      PostUnlock.findOne.mockResolvedValue({ id: 1 });
      User.findByPk.mockResolvedValue({ id: 3, nickname: 'n' });
      PostLike.findOne.mockResolvedValue(null);
      const result = await circleService.getPostDetail(2, 1);
      expect(result.locked).toBe(false);
      expect(result.isLiked).toBe(false);
    });

    it('returns owner-visible private posts', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, user_id: 2, is_private: 1, images: null });
      User.findByPk.mockResolvedValue(null);
      PostLike.findOne.mockResolvedValue({ id: 1 });
      const result = await circleService.getPostDetail(2, 1);
      expect(result.images).toEqual([]);
      expect(result.isLiked).toBe(true);
    });
  });

  describe('unlockPost', () => {
    it('rejects missing, public, already unlocked and wrong password', async () => {
      Post.findByPk.mockResolvedValue(null);
      await expect(circleService.unlockPost(2, 1, 1, 'p')).rejects.toThrow('帖子不存在');

      Post.findByPk.mockResolvedValue({ id: 1, is_private: 0 });
      await expect(circleService.unlockPost(2, 1, 1, 'p')).rejects.toThrow('帖子不需要解锁');

      Post.findByPk.mockResolvedValue({ id: 1, is_private: 1, private_password: 'hash' });
      PostUnlock.findOne.mockResolvedValue({ id: 1 });
      await expect(circleService.unlockPost(2, 1, 1, 'p')).rejects.toThrow('已解锁过该帖子');

      Post.findByPk.mockResolvedValue({ id: 1, is_private: 1, private_password: 'different' });
      PostUnlock.findOne.mockResolvedValue(null);
      await expect(circleService.unlockPost(2, 1, 1, 'p')).rejects.toThrow('密码错误');
    });

    it('unlocks a password post', async () => {
      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update('pw').digest('hex');
      Post.findByPk.mockResolvedValue({ id: 1, is_private: 1, private_password: hash, private_price: 0 });
      PostUnlock.findOne.mockResolvedValue(null);
      PostUnlock.create.mockResolvedValue({ id: 1 });
      await expect(circleService.unlockPost(2, 1, 1, 'pw')).resolves.toBe(true);
      expect(User.update).not.toHaveBeenCalled();
    });

    it('charges for a paid post', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, user_id: 3, is_private: 2, private_price: 20 });
      PostUnlock.findOne.mockResolvedValue(null);
      PostUnlock.create.mockResolvedValue({ id: 1 });
      User.update.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      await expect(circleService.unlockPost(2, 1, 2)).resolves.toBe(true);
      expect(User.increment).toHaveBeenCalled();
    });

    it('rejects when balance is insufficient', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, user_id: 3, is_private: 2, private_price: 20 });
      PostUnlock.findOne.mockResolvedValue(null);
      PostUnlock.create.mockResolvedValue({ id: 1 });
      User.update.mockResolvedValue([0]);
      const tx = txn();
      sequelize.transaction.mockResolvedValue(tx);
      await expect(circleService.unlockPost(2, 1, 2)).rejects.toThrow('虚拟币不足');
      expect(tx.rollback).toHaveBeenCalled();
    });

    it('maps unique constraint errors', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, user_id: 3, is_private: 2, private_price: 20 });
      PostUnlock.findOne.mockResolvedValue(null);
      PostUnlock.create.mockRejectedValue(Object.assign(new Error('dup'), { name: 'SequelizeUniqueConstraintError' }));
      await expect(circleService.unlockPost(2, 1, 2)).rejects.toThrow('已解锁过该帖子');
    });
  });

  it('getMyPosts maps rows', async () => {
    Post.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 1, content: 'c', images: 'a.jpg,b.jpg', videos: 'v', thumb_num: 1, comment_num: 1, create_time: 1 }]
    });
    const result = await circleService.getMyPosts(2, 1, 10);
    expect(result.list[0].images).toEqual(['a.jpg', 'b.jpg']);

    Post.findAndCountAll.mockResolvedValue({ count: 0, rows: [{ id: 2, images: null }] });
    const second = await circleService.getMyPosts(2, 1, 10);
    expect(second.list[0].images).toEqual([]);
  });

  describe('likePost', () => {
    it('rejects missing posts', async () => {
      Post.findByPk.mockResolvedValue(null);
      await expect(circleService.likePost(2, 1)).rejects.toThrow('帖子不存在');
    });

    it('toggles a like off', async () => {
      const destroy = jest.fn().mockResolvedValue(true);
      Post.findByPk.mockResolvedValue({ id: 1, decrement: jest.fn().mockResolvedValue(true) });
      PostLike.findOne.mockResolvedValue({ id: 1, destroy });
      const result = await circleService.likePost(2, 1);
      expect(result).toEqual({ isLiked: false });
      expect(destroy).toHaveBeenCalled();
    });

    it('toggles a like on', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, increment: jest.fn().mockResolvedValue(true) });
      PostLike.findOne.mockResolvedValue(null);
      PostLike.create.mockResolvedValue({ id: 1 });
      const result = await circleService.likePost(2, 1);
      expect(result).toEqual({ isLiked: true });
    });
  });

  describe('commentPost', () => {
    it('rejects missing posts', async () => {
      Post.findByPk.mockResolvedValue(null);
      await expect(circleService.commentPost(2, 1, 'c', 0)).rejects.toThrow('帖子不存在');
    });

    it('creates a comment and a reply', async () => {
      Post.findByPk.mockResolvedValue({ id: 1, increment: jest.fn().mockResolvedValue(true) });
      PostComment.create.mockResolvedValue({ id: 5 });
      const plain = await circleService.commentPost(2, 1, 'c', 0);
      expect(plain).toEqual({ commentId: 5 });

      PostComment.findByPk.mockResolvedValue({ id: 4, user_id: 9 });
      const reply = await circleService.commentPost(2, 1, 'r', 4);
      expect(reply).toEqual({ commentId: 5 });
      expect(PostComment.create.mock.calls[1][0].reply_user_id).toBe(9);
    });
  });

  it('getComments maps replies', async () => {
    PostComment.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 1, user_id: 2, content: 'c', reply_id: 1, reply_user_id: 3, create_time: 1 }]
    });
    User.findByPk
      .mockResolvedValueOnce({ id: 2, nickname: 'a', avatar: 'x' })
      .mockResolvedValueOnce({ id: 3, nickname: 'b' });
    const result = await circleService.getComments(1, 1, 10);
    expect(result.list[0].replyUser).toEqual({ userId: 3, nickname: 'b' });

    PostComment.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 2, user_id: 2, content: 'c', reply_id: 0, reply_user_id: 0, create_time: 1 }]
    });
    User.findByPk.mockResolvedValue(null);
    const noReply = await circleService.getComments(1, 1, 10);
    expect(noReply.list[0].replyUser).toBe(null);
  });

  it('getTags returns an empty list', async () => {
    expect(await circleService.getTags()).toEqual([]);
  });

  describe('deletePost', () => {
    it('rejects missing posts', async () => {
      Post.findOne.mockResolvedValue(null);
      await expect(circleService.deletePost(2, 1)).rejects.toThrow('动态不存在或无权删除');
    });

    it('deletes posts and tolerates cleanup failures', async () => {
      Post.findOne.mockResolvedValue({ id: 1, destroy: jest.fn().mockResolvedValue(true) });
      await expect(circleService.deletePost(2, 1)).resolves.toBe(true);

      mediaAssetService.removeByBiz.mockRejectedValue(new Error('cos down'));
      Post.findOne.mockResolvedValue({ id: 1, destroy: jest.fn().mockResolvedValue(true) });
      await expect(circleService.deletePost(2, 1)).resolves.toBe(true);
      await new Promise((resolve) => setImmediate(resolve));
    });
  });
});
