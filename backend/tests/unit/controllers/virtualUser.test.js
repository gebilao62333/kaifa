const virtualUserController = require('../../../src/controllers/virtualUser');

jest.mock('../../../src/services/virtualUserService', () => ({
  createVirtualUser: jest.fn(),
  getVirtualUserById: jest.fn(),
  getAllVirtualUsers: jest.fn(),
  updateVirtualUser: jest.fn(),
  deleteVirtualUser: jest.fn(),
  toggleOnlineStatus: jest.fn(),
  chatWithVirtualUser: jest.fn(),
  getChatHistory: jest.fn(),
  clearContext: jest.fn()
}));

const virtualUserService = require('../../../src/services/virtualUserService');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - VirtualUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createVirtualUser rejects missing name', async () => {
    const res = mockRes();
    await virtualUserController.createVirtualUser(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createVirtualUser applies defaults', async () => {
    virtualUserService.createVirtualUser.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await virtualUserController.createVirtualUser(mockReq({ body: { name: '小美', tagIds: [1, 2] } }), res);

    expect(virtualUserService.createVirtualUser).toHaveBeenCalledWith({
      name: '小美', avatar: undefined, gender: 0, age: 0, region: undefined, tags: undefined,
      intro: undefined, price_per_hour: 0, online_status: 0, is_recommend: 0, status: 1, tagIds: [1, 2]
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createVirtualUser maps error to 422', async () => {
    virtualUserService.createVirtualUser.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await virtualUserController.createVirtualUser(mockReq({ body: { name: 'x' } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getVirtualUser returns detail', async () => {
    virtualUserService.getVirtualUserById.mockResolvedValue({ id: 5 });
    const res = mockRes();
    await virtualUserController.getVirtualUser(mockReq({ params: { id: '5' } }), res);
    expect(virtualUserService.getVirtualUserById).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getVirtualUser maps error to 404', async () => {
    virtualUserService.getVirtualUserById.mockRejectedValue(new Error('not found'));
    const res = mockRes();
    await virtualUserController.getVirtualUser(mockReq({ params: { id: '5' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getAllVirtualUsers returns list', async () => {
    virtualUserService.getAllVirtualUsers.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await virtualUserController.getAllVirtualUsers(mockReq({ query: { page: '1' } }), res);
    expect(virtualUserService.getAllVirtualUsers).toHaveBeenCalledWith({ page: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getAllVirtualUsers maps error to 500', async () => {
    virtualUserService.getAllVirtualUsers.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await virtualUserController.getAllVirtualUsers(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('updateVirtualUser succeeds', async () => {
    virtualUserService.updateVirtualUser.mockResolvedValue({ id: 5 });
    const res = mockRes();
    await virtualUserController.updateVirtualUser(mockReq({ params: { id: '5' }, body: { name: 'n' } }), res);
    expect(virtualUserService.updateVirtualUser).toHaveBeenCalledWith(5, { name: 'n' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateVirtualUser maps error to 422', async () => {
    virtualUserService.updateVirtualUser.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await virtualUserController.updateVirtualUser(mockReq({ params: { id: '5' }, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('deleteVirtualUser succeeds and maps error to 404', async () => {
    virtualUserService.deleteVirtualUser.mockResolvedValue(true);
    const ok = mockRes();
    await virtualUserController.deleteVirtualUser(mockReq({ params: { id: '5' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    virtualUserService.deleteVirtualUser.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await virtualUserController.deleteVirtualUser(mockReq({ params: { id: '5' } }), err);
    expect(err.status).toHaveBeenCalledWith(404);
  });

  it('toggleOnlineStatus online/offline messages', async () => {
    virtualUserService.toggleOnlineStatus.mockResolvedValue(true);

    const on = mockRes();
    await virtualUserController.toggleOnlineStatus(mockReq({ params: { id: '5' }, body: { isOnline: true } }), on);
    expect(virtualUserService.toggleOnlineStatus).toHaveBeenCalledWith(5, true);
    expect(on.json).toHaveBeenCalledWith(expect.objectContaining({ message: '虚拟用户已上线' }));

    const off = mockRes();
    await virtualUserController.toggleOnlineStatus(mockReq({ params: { id: '5' }, body: { isOnline: false } }), off);
    expect(off.json).toHaveBeenCalledWith(expect.objectContaining({ message: '虚拟用户已下线' }));
  });

  it('toggleOnlineStatus maps error to 404', async () => {
    virtualUserService.toggleOnlineStatus.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await virtualUserController.toggleOnlineStatus(mockReq({ params: { id: '5' }, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('chatWithVirtualUser rejects empty message', async () => {
    const res = mockRes();
    await virtualUserController.chatWithVirtualUser(mockReq({ params: { virtualUserId: '5' }, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('chatWithVirtualUser succeeds', async () => {
    virtualUserService.chatWithVirtualUser.mockResolvedValue({ reply: 'hi' });
    const res = mockRes();
    await virtualUserController.chatWithVirtualUser(mockReq({ params: { virtualUserId: '5' }, body: { message: 'hello' } }), res);
    expect(virtualUserService.chatWithVirtualUser).toHaveBeenCalledWith(5, 100001, 'hello');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('chatWithVirtualUser maps error to 422', async () => {
    virtualUserService.chatWithVirtualUser.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await virtualUserController.chatWithVirtualUser(mockReq({ params: { virtualUserId: '5' }, body: { message: 'm' } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getChatHistory returns history', async () => {
    virtualUserService.getChatHistory.mockResolvedValue([]);
    const res = mockRes();
    await virtualUserController.getChatHistory(mockReq({ params: { virtualUserId: '5' }, query: { contextId: 'c1' } }), res);
    expect(virtualUserService.getChatHistory).toHaveBeenCalledWith(5, 100001, 'c1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getChatHistory maps error to 500', async () => {
    virtualUserService.getChatHistory.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await virtualUserController.getChatHistory(mockReq({ params: { virtualUserId: '5' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('clearContext succeeds and maps error', async () => {
    virtualUserService.clearContext.mockResolvedValue(true);
    const ok = mockRes();
    await virtualUserController.clearContext(mockReq({ params: { virtualUserId: '5' }, query: {} }), ok);
    expect(virtualUserService.clearContext).toHaveBeenCalledWith(5, 100001, undefined);
    expect(ok.status).toHaveBeenCalledWith(200);

    virtualUserService.clearContext.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await virtualUserController.clearContext(mockReq({ params: { virtualUserId: '5' } }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });
});
