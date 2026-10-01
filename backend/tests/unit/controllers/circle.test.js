const circleController = require('../../../src/controllers/circle');

jest.mock('../../../src/services', () => ({
  circleService: {
    createPost: jest.fn(),
    getPosts: jest.fn(),
    getPostDetail: jest.fn(),
    unlockPost: jest.fn(),
    getMyPosts: jest.fn(),
    deletePost: jest.fn(),
    likePost: jest.fn(),
    commentPost: jest.fn(),
    getComments: jest.fn(),
    getTags: jest.fn()
  },
  cosSignedUrlService: {
    resolveUrls: jest.fn(urls => Promise.resolve(urls || [])),
    getSignedAccessUrl: jest.fn(url => Promise.resolve(url))
  }
}));

const { circleService } = require('../../../src/services');

// getAdminPosts 直接使用 models 查询，需 mock 避免连真实数据库
jest.mock('../../../src/models', () => ({
  Post: {
    findAndCountAll: jest.fn().mockResolvedValue({
      count: 3,
      rows: [
        { id: 1, user_id: 1, author: { nickname: '用户A', avatar: '' }, content: '王者上分帖', images: [], like_count: 5, comment_count: 2, status: 1, visibility: 0, create_time: '2026-01-01' },
        { id: 2, user_id: 2, author: { nickname: '用户B', avatar: '' }, content: '吃鸡三连', images: [], like_count: 3, comment_count: 1, status: 1, visibility: 0, create_time: '2026-01-02' },
        { id: 3, user_id: 3, author: { nickname: '用户C', avatar: '' }, content: '原神组队', images: [], like_count: 1, comment_count: 0, status: 1, visibility: 0, create_time: '2026-01-03' }
      ]
    })
  },
  User: {
    findByPk: jest.fn()
  },
  SystemSettings: {
    findOne: jest.fn().mockResolvedValue(null)
  }
}));

const mockReq = (overrides = {}) => ({
  userId: 100001,
  body: {},
  query: {},
  params: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Circle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== createPost ====================
  describe('createPost', () => {
    it('should reject empty content/images/videos', async () => {
      const req = mockReq({ body: { content: '' } });
      const res = mockRes();

      await circleController.createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 400 })
      );
    });

    it('should create post with valid content', async () => {
      const mockPost = { id: 1, content: '测试帖子' };
      circleService.createPost.mockResolvedValue(mockPost);

      const req = mockReq({
        body: { content: '测试帖子', images: [], visibility: 0, price: 0 }
      });
      const res = mockRes();

      await circleController.createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 201, data: mockPost, message: '发布成功' })
      );
    });

    it('should handle service error with 500', async () => {
      circleService.createPost.mockRejectedValue(new Error('发布失败'));

      const req = mockReq({ body: { content: '测试' } });
      const res = mockRes();

      await circleController.createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==================== getPosts ====================
  describe('getPosts', () => {
    it('should return paginated post list', async () => {
      const mockList = [
        { id: 1, content: '帖子1', images: ['a.jpg'] },
        { id: 2, content: '帖子2', images: ['b.jpg'] }
      ];
      circleService.getPosts.mockResolvedValue({
        list: mockList,
        total: 2,
        page: 1,
        pageSize: 20
      });

      const req = mockReq({ query: { page: '1', pageSize: '20' } });
      const res = mockRes();

      await circleController.getPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(circleService.getPosts).toHaveBeenCalledWith(100001, null, 1, 20);
    });

    it('should filter by tagId', async () => {
      circleService.getPosts.mockResolvedValue({ list: [], total: 0 });

      const req = mockReq({ query: { tagId: '5' } });
      const res = mockRes();

      await circleController.getPosts(req, res);

      expect(circleService.getPosts).toHaveBeenCalledWith(100001, 5, 1, 20);
    });

    it('should handle non-paginated response without list', async () => {
      circleService.getPosts.mockResolvedValue([{ id: 1 }]);

      const req = mockReq();
      const res = mockRes();

      await circleController.getPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== getPostDetail ====================
  describe('getPostDetail', () => {
    it('should reject empty post id', async () => {
      const req = mockReq({ params: {} });
      const res = mockRes();

      await circleController.getPostDetail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return post detail', async () => {
      const mockPost = { id: 1, content: '详情', images: [] };
      circleService.getPostDetail.mockResolvedValue(mockPost);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await circleController.getPostDetail(req, res);

      expect(circleService.getPostDetail).toHaveBeenCalledWith(100001, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 422 on not found', async () => {
      circleService.getPostDetail.mockRejectedValue(new Error('帖子不存在'));

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await circleController.getPostDetail(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  // ==================== likePost ====================
  describe('likePost', () => {
    it('should reject empty postId', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await circleController.likePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should toggle like to liked', async () => {
      circleService.likePost.mockResolvedValue({ isLiked: true });

      const req = mockReq({ body: { postId: 1 } });
      const res = mockRes();

      await circleController.likePost(req, res);

      expect(circleService.likePost).toHaveBeenCalledWith(100001, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '点赞成功' })
      );
    });

    it('should toggle like to unliked', async () => {
      circleService.likePost.mockResolvedValue({ isLiked: false });

      const req = mockReq({ body: { postId: 1 } });
      const res = mockRes();

      await circleController.likePost(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '取消点赞' })
      );
    });
  });

  // ==================== commentPost ====================
  describe('commentPost', () => {
    it('should reject empty postId or content', async () => {
      const req = mockReq({ body: { content: '评论' } });
      const res = mockRes();

      await circleController.commentPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create comment successfully', async () => {
      const mockComment = { id: 1, content: '好帖' };
      circleService.commentPost.mockResolvedValue(mockComment);

      const req = mockReq({ body: { postId: 1, content: '好帖' } });
      const res = mockRes();

      await circleController.commentPost(req, res);

      expect(circleService.commentPost).toHaveBeenCalledWith(100001, 1, '好帖', 0);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '评论成功' })
      );
    });

    it('should create reply with replyId', async () => {
      circleService.commentPost.mockResolvedValue({ id: 2 });

      const req = mockReq({ body: { postId: 1, content: '回复你', replyId: 5 } });
      const res = mockRes();

      await circleController.commentPost(req, res);

      expect(circleService.commentPost).toHaveBeenCalledWith(100001, 1, '回复你', 5);
    });
  });

  // ==================== getComments ====================
  describe('getComments', () => {
    it('should reject empty postId', async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await circleController.getComments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return comments with pagination', async () => {
      const mockComments = [{ id: 1, content: '评论1' }, { id: 2, content: '评论2' }];
      circleService.getComments.mockResolvedValue(mockComments);

      const req = mockReq({ query: { postId: '1', page: '1', pageSize: '10' } });
      const res = mockRes();

      await circleController.getComments(req, res);

      expect(circleService.getComments).toHaveBeenCalledWith(1, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== deletePost ====================
  describe('deletePost', () => {
    it('should reject empty postId', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await circleController.deletePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should delete post successfully', async () => {
      circleService.deletePost.mockResolvedValue(true);

      const req = mockReq({ body: { postId: 1 } });
      const res = mockRes();

      await circleController.deletePost(req, res);

      expect(circleService.deletePost).toHaveBeenCalledWith(100001, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== getMyPosts ====================
  describe('getMyPosts', () => {
    it('should return my posts', async () => {
      const mockPosts = [{ id: 1, content: '我的帖子' }];
      circleService.getMyPosts.mockResolvedValue(mockPosts);

      const req = mockReq({ query: { page: '1', pageSize: '10' } });
      const res = mockRes();

      await circleController.getMyPosts(req, res);

      expect(circleService.getMyPosts).toHaveBeenCalledWith(100001, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== getTags ====================
  describe('getTags', () => {
    it('should return tag list', async () => {
      const mockTags = [{ id: 1, name: '游戏' }, { id: 2, name: '生活' }];
      circleService.getTags.mockResolvedValue(mockTags);

      const req = mockReq();
      const res = mockRes();

      await circleController.getTags(req, res);

      expect(circleService.getTags).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle error with 500', async () => {
      circleService.getTags.mockRejectedValue(new Error('数据库错误'));

      const req = mockReq();
      const res = mockRes();

      await circleController.getTags(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==================== getAdminPosts ====================
  describe('getAdminPosts', () => {
    it('should return admin post list', async () => {
      const req = mockReq({ query: { page: '1', pageSize: '20' } });
      const res = mockRes();

      await circleController.getAdminPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const call = res.json.mock.calls[0][0];
      expect(call.data.list).toBeDefined();
      expect(call.data.pagination.totalPages).toBeDefined();
    });

    it('should filter by keyword', async () => {
      const req = mockReq({ query: { keyword: '王者' } });
      const res = mockRes();

      await circleController.getAdminPosts(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.data.list.length).toBeLessThanOrEqual(3);
    });

    it('should filter by status', async () => {
      const req = mockReq({ query: { status: '1' } });
      const res = mockRes();

      await circleController.getAdminPosts(req, res);

      const call = res.json.mock.calls[0][0];
      call.data.list.forEach(post => {
        expect(post.status).toBe(1);
      });
    });
  });

  // ==================== unlockPost ====================
  describe('unlockPost', () => {
    it('should reject empty postId', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await circleController.unlockPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should unlock post successfully with password', async () => {
      circleService.unlockPost.mockResolvedValue(true);

      const req = mockReq({ body: { postId: 1, unlockType: 1, password: 'abc123' } });
      const res = mockRes();

      await circleController.unlockPost(req, res);

      expect(circleService.unlockPost).toHaveBeenCalledWith(100001, 1, 1, 'abc123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '解锁成功' })
      );
    });
  });
});
