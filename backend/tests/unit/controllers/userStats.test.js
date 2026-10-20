jest.mock('../../../src/services', () => ({
  authService: {},
  smsService: {},
  levelService: {},
  skinService: {}
}));
jest.mock('../../../src/models', () => ({
  User: {},
  Post: { sum: jest.fn() },
  PostLike: {},
  UserFollow: { count: jest.fn() },
  UserVisit: { count: jest.fn() },
  UserPref: {}
}));
jest.mock('../../../src/utils/privacyPrefs', () => ({ getPrivacyPrefs: jest.fn() }));
jest.mock('../../../src/services/tokenRevocation', () => ({}));
jest.mock('../../../src/utils/socialPrivacy', () => ({}));

const userController = require('../../../src/controllers/user');
const { UserFollow, Post, UserVisit } = require('../../../src/models');

const mockReq = (overrides = {}) => ({ body: {}, query: {}, params: {}, userId: 100001, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('GET /api/user/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UserFollow.count.mockResolvedValue(2);
    Post.sum.mockResolvedValue(7);
    UserVisit.count.mockResolvedValue(3);
  });

  it('返回本人关注/粉丝/获赞/访客计数', async () => {
    const res = mockRes();
    await userController.getUserStats(mockReq(), res);
    expect(UserFollow.count).toHaveBeenCalledWith({ where: { follower_id: 100001 } });
    expect(UserFollow.count).toHaveBeenCalledWith({ where: { following_id: 100001 } });
    expect(Post.sum).toHaveBeenCalledWith('thumb_num', { where: { user_id: 100001 } });
    expect(UserVisit.count).toHaveBeenCalledWith({ where: { user_id: 100001 } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { userId: 100001, followCount: 2, fansCount: 2, likeCount: 7, visitorCount: 3 }
    }));
  });

  it('支持查看他人公开计数', async () => {
    const res = mockRes();
    await userController.getUserStats(mockReq({ query: { userId: '200002' } }), res);
    expect(Post.sum).toHaveBeenCalledWith('thumb_num', { where: { user_id: 200002 } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 200002 })
    }));
  });

  it('模型异常返回 500 而非业务 4xx', async () => {
    UserFollow.count.mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await userController.getUserStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
