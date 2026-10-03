const demandController = require('../../../src/controllers/demand');

jest.mock('../../../src/services', () => ({
  demandService: {
    createDemand: jest.fn(),
    getDemandList: jest.fn(),
    getDemandDetail: jest.fn(),
    cancelDemand: jest.fn()
  }
}));

const { demandService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Demand', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createDemand rejects missing required fields', async () => {
    const res = mockRes();
    await demandController.createDemand(mockReq({ body: { serviceType: 1 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createDemand creates successfully', async () => {
    demandService.createDemand.mockResolvedValue({ id: 1 });
    const body = {
      serviceType: 1, game: '王者', date: '2026-01-01', startTime: '10:00',
      endTime: '11:00', duration: 1, budget: 50, remark: 'r', offlineLocation: 'loc'
    };
    const res = mockRes();

    await demandController.createDemand(mockReq({ body }), res);

    expect(demandService.createDemand).toHaveBeenCalledWith(
      100001, 1, '王者', '2026-01-01', '10:00', '11:00', 1, 50, 'r', 'loc'
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createDemand maps error to 422', async () => {
    demandService.createDemand.mockRejectedValue(new Error('bad'));
    const body = { serviceType: 1, game: 'g', date: 'd', startTime: 's', endTime: 'e', duration: 1, budget: 1 };
    const res = mockRes();
    await demandController.createDemand(mockReq({ body }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getDemandList uses pagination defaults', async () => {
    demandService.getDemandList.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();

    await demandController.getDemandList(mockReq({ query: {} }), res);

    expect(demandService.getDemandList).toHaveBeenCalledWith(100001, 1, 10);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getDemandList returns 500 on error', async () => {
    demandService.getDemandList.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await demandController.getDemandList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getDemandDetail rejects missing id', async () => {
    const res = mockRes();
    await demandController.getDemandDetail(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getDemandDetail returns detail', async () => {
    demandService.getDemandDetail.mockResolvedValue({ id: 7 });
    const res = mockRes();
    await demandController.getDemandDetail(mockReq({ query: { demandId: '7' } }), res);
    // 审计 B-14：控制器把请求者 userId 传给服务层（用于隐藏他人线下地址）
    expect(demandService.getDemandDetail).toHaveBeenCalledWith(7, 100001);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cancelDemand rejects missing id', async () => {
    const res = mockRes();
    await demandController.cancelDemand(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('cancelDemand succeeds', async () => {
    demandService.cancelDemand.mockResolvedValue(true);
    const res = mockRes();
    await demandController.cancelDemand(mockReq({ body: { demandId: '7' } }), res);
    expect(demandService.cancelDemand).toHaveBeenCalledWith(100001, 7);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cancelDemand maps error to 422', async () => {
    demandService.cancelDemand.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await demandController.cancelDemand(mockReq({ body: { demandId: 7 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
