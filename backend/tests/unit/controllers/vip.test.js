const vipController = require('../../../src/controllers/vip');

jest.mock('../../../src/services', () => ({
  vipService: {
    getVipPackages: jest.fn(),
    getUserVipInfo: jest.fn(),
    createVipOrder: jest.fn(),
    completeVipOrder: jest.fn(),
    getVipOrderStatus: jest.fn(),
    getUserVipOrders: jest.fn()
  }
}));

const { vipService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - VIP', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getVipPackages returns packages', async () => {
    vipService.getVipPackages.mockResolvedValue([{ id: 1 }]);
    const res = mockRes();
    await vipController.getVipPackages(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getVipPackages maps error to 500', async () => {
    vipService.getVipPackages.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await vipController.getVipPackages(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getUserVipInfo returns info', async () => {
    vipService.getUserVipInfo.mockResolvedValue({ vip: 1 });
    const res = mockRes();
    await vipController.getUserVipInfo(mockReq(), res);
    expect(vipService.getUserVipInfo).toHaveBeenCalledWith(100001);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createVipOrder rejects missing packageId', async () => {
    const res = mockRes();
    await vipController.createVipOrder(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createVipOrder succeeds', async () => {
    vipService.createVipOrder.mockResolvedValue({ orderNo: 'V1' });
    const res = mockRes();
    await vipController.createVipOrder(mockReq({ body: { packageId: '3' } }), res);
    expect(vipService.createVipOrder).toHaveBeenCalledWith(100001, 3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createVipOrder maps error to 422', async () => {
    vipService.createVipOrder.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await vipController.createVipOrder(mockReq({ body: { packageId: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('completeVipOrder rejects missing orderNo', async () => {
    const res = mockRes();
    await vipController.completeVipOrder(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('completeVipOrder succeeds', async () => {
    vipService.completeVipOrder.mockResolvedValue(true);
    const res = mockRes();
    await vipController.completeVipOrder(mockReq({ body: { orderNo: 'V1', transactionId: 't' } }), res);
    expect(vipService.completeVipOrder).toHaveBeenCalledWith('V1', 't');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('completeVipOrder maps error to 422', async () => {
    vipService.completeVipOrder.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await vipController.completeVipOrder(mockReq({ body: { orderNo: 'V1' } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getVipOrderStatus rejects missing orderNo', async () => {
    const res = mockRes();
    await vipController.getVipOrderStatus(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getVipOrderStatus succeeds', async () => {
    vipService.getVipOrderStatus.mockResolvedValue({ status: 1 });
    const res = mockRes();
    await vipController.getVipOrderStatus(mockReq({ query: { orderNo: 'V1' } }), res);
    // 审计 B-12：控制器把请求者 userId 传给服务层做归属校验
    expect(vipService.getVipOrderStatus).toHaveBeenCalledWith('V1', 100001);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUserVipOrders uses pagination', async () => {
    vipService.getUserVipOrders.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await vipController.getUserVipOrders(mockReq({ query: { page: '3', pageSize: '5' } }), res);
    expect(vipService.getUserVipOrders).toHaveBeenCalledWith(100001, 3, 5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUserVipOrders returns 500 on error', async () => {
    vipService.getUserVipOrders.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await vipController.getUserVipOrders(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
