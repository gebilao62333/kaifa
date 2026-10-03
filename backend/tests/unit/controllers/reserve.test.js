const reserveController = require('../../../src/controllers/reserve');

jest.mock('../../../src/services', () => ({
  reserveService: {
    getAvailableSlots: jest.fn(),
    batchCreateSlots: jest.fn(),
    toggleSlot: jest.fn(),
    createReserve: jest.fn(),
    confirmReserve: jest.fn(),
    rejectReserve: jest.fn(),
    cancelReserve: jest.fn(),
    completeReserve: jest.fn(),
    getReserveList: jest.fn(),
    getReserveDetail: jest.fn()
  }
}));

const { reserveService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Reserve', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getSlots rejects missing params', async () => {
    const res = mockRes();
    await reserveController.getSlots(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getSlots returns slots', async () => {
    reserveService.getAvailableSlots.mockResolvedValue([]);
    const res = mockRes();
    await reserveController.getSlots(mockReq({ query: { companionId: '2', date: '2026-01-01', gameId: '3' } }), res);
    expect(reserveService.getAvailableSlots).toHaveBeenCalledWith(2, '2026-01-01', 3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getSlots maps error to 500', async () => {
    reserveService.getAvailableSlots.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reserveController.getSlots(mockReq({ query: { companionId: 2, date: 'd' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('batchCreateSlots rejects empty slots', async () => {
    const res = mockRes();
    await reserveController.batchCreateSlots(mockReq({ body: { slots: [] } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('batchCreateSlots succeeds with defaults', async () => {
    reserveService.batchCreateSlots.mockResolvedValue(true);
    const res = mockRes();
    await reserveController.batchCreateSlots(mockReq({ body: { slots: [{ time: '10:00' }] } }), res);
    expect(reserveService.batchCreateSlots).toHaveBeenCalledWith(100001, 0, [{ time: '10:00' }]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('batchCreateSlots maps error to 500', async () => {
    reserveService.batchCreateSlots.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reserveController.batchCreateSlots(mockReq({ body: { slots: [1] } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('toggleSlot rejects missing id', async () => {
    const res = mockRes();
    await reserveController.toggleSlot(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('toggleSlot succeeds', async () => {
    reserveService.toggleSlot.mockResolvedValue({ status: 1 });
    const res = mockRes();
    await reserveController.toggleSlot(mockReq({ body: { slotId: '4' } }), res);
    expect(reserveService.toggleSlot).toHaveBeenCalledWith(100001, 4);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('toggleSlot maps error to 422', async () => {
    reserveService.toggleSlot.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reserveController.toggleSlot(mockReq({ body: { slotId: 4 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('createReserve rejects missing params', async () => {
    const res = mockRes();
    await reserveController.createReserve(mockReq({ body: { companionId: 2 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createReserve succeeds', async () => {
    reserveService.createReserve.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await reserveController.createReserve(mockReq({
      body: { companionId: '2', gameId: '3', date: 'd', time: 't', duration: 2, price: 50, remark: 'r', serviceType: 1 }
    }), res);

    expect(reserveService.createReserve).toHaveBeenCalledWith(100001, 2, 3, 'd', 't', {
      duration: 2, price: 50, remark: 'r', serviceType: 1
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createReserve maps error to 422', async () => {
    reserveService.createReserve.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reserveController.createReserve(mockReq({ body: { companionId: 2, date: 'd', time: 't' } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  const simpleCases = [
    ['confirmReserve', 'confirmReserve'], ['rejectReserve', 'rejectReserve'], ['completeReserve', 'completeReserve']
  ];
  simpleCases.forEach(([fn, serviceFn]) => {
    it(fn + ' rejects missing reserveId', async () => {
      const res = mockRes();
      await reserveController[fn](mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it(fn + ' succeeds', async () => {
      reserveService[serviceFn].mockResolvedValue(true);
      const res = mockRes();
      await reserveController[fn](mockReq({ body: { reserveId: '9' } }), res);
      expect(reserveService[serviceFn]).toHaveBeenCalledWith(100001, 9);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it(fn + ' maps error to 422', async () => {
      reserveService[serviceFn].mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await reserveController[fn](mockReq({ body: { reserveId: 9 } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  it('cancelReserve succeeds and maps error', async () => {
    reserveService.cancelReserve.mockResolvedValue({ refund: 10 });
    const ok = mockRes();
    await reserveController.cancelReserve(mockReq({ body: { reserveId: '9' } }), ok);
    expect(reserveService.cancelReserve).toHaveBeenCalledWith(100001, 9);
    expect(ok.status).toHaveBeenCalledWith(200);

    reserveService.cancelReserve.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await reserveController.cancelReserve(mockReq({ body: { reserveId: 9 } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('getReserveList uses role and pagination', async () => {
    reserveService.getReserveList.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await reserveController.getReserveList(mockReq({ query: { role: 'companion', status: '1', page: '2', pageSize: '5' } }), res);
    expect(reserveService.getReserveList).toHaveBeenCalledWith(100001, 'companion', '1', 2, 5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getReserveList defaults role to user', async () => {
    reserveService.getReserveList.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await reserveController.getReserveList(mockReq({ query: {} }), res);
    expect(reserveService.getReserveList).toHaveBeenCalledWith(100001, 'user', undefined, 1, 20);
  });

  it('getReserveList maps error to 500', async () => {
    reserveService.getReserveList.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reserveController.getReserveList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getReserveDetail rejects missing id', async () => {
    const res = mockRes();
    await reserveController.getReserveDetail(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getReserveDetail not found maps to 404', async () => {
    reserveService.getReserveDetail.mockRejectedValue(new Error('预约不存在'));
    const res = mockRes();
    await reserveController.getReserveDetail(mockReq({ query: { reserveId: '9' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getReserveDetail other error maps to 500', async () => {
    reserveService.getReserveDetail.mockRejectedValue(new Error('other'));
    const res = mockRes();
    await reserveController.getReserveDetail(mockReq({ query: { reserveId: '9' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
