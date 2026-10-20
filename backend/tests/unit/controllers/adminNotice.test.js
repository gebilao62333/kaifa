jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    jwt: { expiresIn: '7d', refreshExpiresIn: '30d', adminExpiresIn: '12h', secret: 's' },
    admin: { emergencyLogin: false },
    paths: { logs: path.join(os.tmpdir(), 'dsh-admin-notice-logs') }
  };
});
jest.mock('../../../src/config/mysql', () => ({
  query: jest.fn(),
  literal: jest.fn((s) => s),
  transaction: jest.fn(),
  QueryTypes: { SELECT: 'SELECT' }
}));
jest.mock('../../../src/models', () => {
  const model = () => ({
    findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(),
    create: jest.fn(), update: jest.fn(), destroy: jest.fn(), count: jest.fn(),
    sum: jest.fn(), increment: jest.fn(), decrement: jest.fn(), upsert: jest.fn()
  });
  return {
    User: model(), GameOrder: model(), Withdraw: model(), GiftLog: model(),
    Post: model(), VipPackage: model(), RechargePackage: model(), Banner: model(),
    SplashScreen: model(), CompanionProfile: model(), Game: model(), OrderChong: model(),
    Report: model(), Admin: model(), AdminRole: model(), SystemSettings: model(),
    VirtualChatHistory: model(), Gift: model(), Card: model(), Notice: model()
  };
});
jest.mock('../../../src/services/noticeService', () => ({
  NOTICE_NOT_FOUND: 'NOTICE_NOT_FOUND',
  listForAdmin: jest.fn(),
  getNotice: jest.fn(),
  createNotice: jest.fn(),
  updateNotice: jest.fn(),
  deleteNotice: jest.fn()
}));
jest.mock('../../../src/socket', () => ({ broadcastToAll: jest.fn() }));
jest.mock('../../../src/services/adminLoginGuard', () => ({
  getLoginLockState: jest.fn(),
  recordLoginFailure: jest.fn(),
  clearLoginFailures: jest.fn()
}));
jest.mock('../../../src/services/tokenRevocation', () => ({
  revokeToken: jest.fn(),
  checkRevocation: jest.fn(),
  revocationFailMode: jest.fn(() => 'open'),
  revokeAllUserTokens: jest.fn()
}));

const adminController = require('../../../src/controllers/admin');
const noticeService = require('../../../src/services/noticeService');
const { broadcastToAll } = require('../../../src/socket');

const mockReq = (overrides = {}) => ({ userId: 1, body: {}, query: {}, params: {}, admin: { id: 9 }, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Admin notice（B-3/B-4）', () => {
  beforeEach(() => jest.clearAllMocks());

  it('list 透传筛选参数', async () => {
    noticeService.listForAdmin.mockResolvedValue({ list: [], pagination: {} });
    const res = mockRes();
    await adminController.getNoticeList(mockReq({ query: { status: '1', keyword: '活动', page: '2', pageSize: '5' } }), res);
    expect(noticeService.listForAdmin).toHaveBeenCalledWith({ status: '1', keyword: '活动', page: '2', pageSize: '5' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('detail 不存在映射 404', async () => {
    const err = new Error('公告不存在');
    err.code = 'NOTICE_NOT_FOUND';
    noticeService.getNotice.mockRejectedValue(err);
    const res = mockRes();
    await adminController.getNoticeDetail(mockReq({ params: { id: '3' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('create 发布中的公告会全服广播 notice_created', async () => {
    const item = { id: 1, title: 't', content: 'c', status: 1 };
    noticeService.createNotice.mockResolvedValue(item);
    const res = mockRes();
    await adminController.createNotice(mockReq({ body: { title: 't', content: 'c' } }), res);
    expect(noticeService.createNotice).toHaveBeenCalledWith({ title: 't', content: 'c' }, 9);
    expect(broadcastToAll).toHaveBeenCalledWith('notice_created', { notice: item });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('create 下线公告不广播', async () => {
    noticeService.createNotice.mockResolvedValue({ id: 2, status: 0 });
    await adminController.createNotice(mockReq({ body: { title: 't', content: 'c', status: 0 } }), mockRes());
    expect(broadcastToAll).not.toHaveBeenCalled();
  });

  it('create 参数非法映射 400', async () => {
    const err = new Error('公告标题不能为空');
    err.code = 'INVALID_PAYLOAD';
    noticeService.createNotice.mockRejectedValue(err);
    const res = mockRes();
    await adminController.createNotice(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('update 下线时广播 notice_deleted 让在线端移除', async () => {
    noticeService.updateNotice.mockResolvedValue({ id: 1, status: 0 });
    await adminController.updateNotice(mockReq({ params: { id: '1' }, body: { status: 0 } }), mockRes());
    expect(broadcastToAll).toHaveBeenCalledWith('notice_deleted', { id: 1 });
  });

  it('update 发布中广播 notice_updated', async () => {
    noticeService.updateNotice.mockResolvedValue({ id: 1, status: 1 });
    await adminController.updateNotice(mockReq({ params: { id: '1' }, body: { title: 'x' } }), mockRes());
    expect(broadcastToAll).toHaveBeenCalledWith('notice_updated', { notice: { id: 1, status: 1 } });
  });

  it('delete 成功后广播 notice_deleted', async () => {
    noticeService.deleteNotice.mockResolvedValue({ id: 1, deleted: true });
    const res = mockRes();
    await adminController.deleteNotice(mockReq({ params: { id: '1' } }), res);
    expect(broadcastToAll).toHaveBeenCalledWith('notice_deleted', { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('广播失败不影响接口成功（尽力而为）', async () => {
    noticeService.createNotice.mockResolvedValue({ id: 1, status: 1 });
    broadcastToAll.mockImplementation(() => { throw new Error('socket down'); });
    const res = mockRes();
    await adminController.createNotice(mockReq({ body: { title: 't', content: 'c' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
