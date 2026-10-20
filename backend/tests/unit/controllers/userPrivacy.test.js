jest.mock('../../../src/services', () => ({
  authService: { getUserInfo: jest.fn() },
  smsService: {},
  levelService: {},
  skinService: {}
}));
jest.mock('../../../src/models', () => ({
  User: {},
  Post: {},
  PostLike: {},
  UserFollow: {},
  UserVisit: { findOne: jest.fn(), create: jest.fn() },
  UserPref: {}
}));
jest.mock('../../../src/utils/privacyPrefs', () => ({ getPrivacyPrefs: jest.fn(), getStealthSettings: jest.fn() }));
jest.mock('../../../src/services/tokenRevocation', () => ({}));
jest.mock('../../../src/utils/socialPrivacy', () => ({}));

const userController = require('../../../src/controllers/user');
const { authService } = require('../../../src/services');
const { UserVisit } = require('../../../src/models');
const { getPrivacyPrefs, getStealthSettings } = require('../../../src/utils/privacyPrefs');

const mockReq = (overrides = {}) => ({ body: {}, query: {}, params: {}, userId: 100001, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('用户隐私开关消费点（C-9）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrivacyPrefs.mockResolvedValue({ showLocation: true, allowVisit: true });
    getStealthSettings.mockResolvedValue({ stealth: false, hideOnline: false, stealthBrowse: false });
  });

  it('showLocation=false：查看他人隐藏城市，查看本人保留', async () => {
    getPrivacyPrefs.mockResolvedValue({ showLocation: false, allowVisit: true });
    // 每次返回新对象：handler 会就地隐藏 city，不能复用同一个引用
    authService.getUserInfo.mockImplementation(async () => ({ userId: 2, city: '上海', nickname: 'n' }));

    const other = mockRes();
    await userController.getUserInfo(mockReq({ userId: 1, query: { userId: '2' } }), other);
    expect(getPrivacyPrefs).toHaveBeenCalledWith(2);
    expect(other.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ city: '' }) }));

    const self = mockRes();
    await userController.getUserInfo(mockReq({ userId: 2, query: { userId: '2' } }), self);
    expect(self.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ city: '上海' }) }));
  });

  it('allowVisit=false：访问记录静默跳过写入但仍回 ok', async () => {
    getPrivacyPrefs.mockResolvedValue({ showLocation: true, allowVisit: false });
    const res = mockRes();
    await userController.recordVisit(mockReq({ userId: 1, body: { targetUserId: 2 } }), res);
    expect(UserVisit.findOne).not.toHaveBeenCalled();
    expect(UserVisit.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('stealthBrowse=true：隐身访问不写访问记录', async () => {
    getStealthSettings.mockResolvedValue({ stealth: false, hideOnline: false, stealthBrowse: true });
    const res = mockRes();
    await userController.recordVisit(mockReq({ userId: 1, body: { targetUserId: 2 } }), res);
    expect(getStealthSettings).toHaveBeenCalledWith(1);
    expect(UserVisit.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allowVisit=true：正常写入访问记录', async () => {
    UserVisit.findOne.mockResolvedValue(null);
    UserVisit.create.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await userController.recordVisit(mockReq({ userId: 1, body: { targetUserId: 2 } }), res);
    expect(UserVisit.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 2, visitor_id: 1 }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
