const gamesController = require('../../../src/controllers/games');

jest.mock('../../../src/services', () => ({
  gamesService: {
    getCategories: jest.fn(),
    getCompanions: jest.fn(),
    searchCompanions: jest.fn(),
    createOrder: jest.fn(),
    grabOrder: jest.fn(),
    startOrder: jest.fn(),
    completeOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getOrders: jest.fn(),
    applyAsCompanion: jest.fn(),
    getApplyStatus: jest.fn()
  }
}));

const { gamesService } = require('../../../src/services');

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

describe('Controller - Games', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== getCategories ====================
  describe('getCategories', () => {
    it('should return game categories', async () => {
      const mockCategories = [
        { id: 1, name: '王者荣耀' },
        { id: 2, name: '和平精英' }
      ];
      gamesService.getCategories.mockResolvedValue(mockCategories);

      const req = mockReq();
      const res = mockRes();

      await gamesController.getCategories(req, res);

      expect(gamesService.getCategories).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 200, data: mockCategories })
      );
    });

    it('should handle error with 500', async () => {
      gamesService.getCategories.mockRejectedValue(new Error('数据库连接失败'));

      const req = mockReq();
      const res = mockRes();

      await gamesController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==================== getCompanions ====================
  describe('getCompanions', () => {
    it('should return paginated companion list', async () => {
      const mockCompanions = {
        list: [{ id: 1, nickname: '小雪', level: 28 }],
        total: 1,
        page: 1,
        pageSize: 20
      };
      gamesService.getCompanions.mockResolvedValue(mockCompanions);

      const req = mockReq({ query: { page: '1', pageSize: '20' } });
      const res = mockRes();

      await gamesController.getCompanions(req, res);

      expect(gamesService.getCompanions).toHaveBeenCalledWith(null, 1, 20);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by gameId', async () => {
      gamesService.getCompanions.mockResolvedValue({ list: [], total: 0 });

      const req = mockReq({ query: { gameId: '1', page: '1', pageSize: '10' } });
      const res = mockRes();

      await gamesController.getCompanions(req, res);

      expect(gamesService.getCompanions).toHaveBeenCalledWith(1, 1, 10);
    });
  });

  // ==================== searchCompanions ====================
  describe('searchCompanions', () => {
    it('should search by keyword', async () => {
      const mockResults = [{ id: 1, nickname: '小雪' }];
      gamesService.searchCompanions.mockResolvedValue(mockResults);

      const req = mockReq({ query: { keyword: '雪', page: '1', pageSize: '10' } });
      const res = mockRes();

      await gamesController.searchCompanions(req, res);

      expect(gamesService.searchCompanions).toHaveBeenCalledWith('雪', null, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should search by keyword and gameId', async () => {
      gamesService.searchCompanions.mockResolvedValue([]);

      const req = mockReq({ query: { keyword: '大神', gameId: '2' } });
      const res = mockRes();

      await gamesController.searchCompanions(req, res);

      expect(gamesService.searchCompanions).toHaveBeenCalledWith('大神', 2, 1, 20);
    });
  });

  // ==================== createOrder ====================
  describe('createOrder', () => {
    it('should reject empty targetUserId or gameId', async () => {
      const req = mockReq({ body: { gameId: 1 } });
      const res = mockRes();

      await gamesController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create order successfully', async () => {
      const mockOrder = { id: 1, orderNo: 'DD20240101001', totalPrice: 60 };
      gamesService.createOrder.mockResolvedValue(mockOrder);

      const req = mockReq({ body: { targetUserId: 2, gameId: 1, num: 2 } });
      const res = mockRes();

      await gamesController.createOrder(req, res);

      expect(gamesService.createOrder).toHaveBeenCalledWith(100001, 2, 1, 2, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '下单成功' })
      );
    });

    it('should default num to 1', async () => {
      gamesService.createOrder.mockResolvedValue({ id: 1 });
      const req = mockReq({ body: { targetUserId: 2, gameId: 1 } });
      const res = mockRes();

      await gamesController.createOrder(req, res);

      expect(gamesService.createOrder).toHaveBeenCalledWith(100001, 2, 1, 1, undefined);
    });

    it('should create an open bounty order when targetUserId is absent but price is given', async () => {
      gamesService.createOrder.mockResolvedValue({ id: 9 });
      const req = mockReq({ body: { gameId: 1, price: 30, num: 2 } });
      const res = mockRes();

      await gamesController.createOrder(req, res);

      // 悬赏单：targetUserId 传 0，进入派单池等待抢单
      expect(gamesService.createOrder).toHaveBeenCalledWith(100001, 0, 1, 2, 30);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== grabOrder ====================
  describe('grabOrder', () => {
    it('should reject empty orderId', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await gamesController.grabOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should grab order successfully', async () => {
      gamesService.grabOrder.mockResolvedValue({ success: true });

      const req = mockReq({ body: { orderId: 1 } });
      const res = mockRes();

      await gamesController.grabOrder(req, res);

      expect(gamesService.grabOrder).toHaveBeenCalledWith(100001, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 422 when grab fails', async () => {
      gamesService.grabOrder.mockRejectedValue(new Error('订单已被抢'));

      const req = mockReq({ body: { orderId: 1 } });
      const res = mockRes();

      await gamesController.grabOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  // ==================== startOrder ====================
  describe('startOrder', () => {
    it('should reject empty orderId', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await gamesController.startOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should start service successfully', async () => {
      gamesService.startOrder.mockResolvedValue(true);

      const req = mockReq({ body: { orderId: 1 } });
      const res = mockRes();

      await gamesController.startOrder(req, res);

      expect(gamesService.startOrder).toHaveBeenCalledWith(100001, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '已开始陪玩' })
      );
    });
  });

  // ==================== completeOrder ====================
  describe('completeOrder', () => {
    it('should complete order successfully', async () => {
      gamesService.completeOrder.mockResolvedValue(true);

      const req = mockReq({ body: { orderId: 1 } });
      const res = mockRes();

      await gamesController.completeOrder(req, res);

      expect(gamesService.completeOrder).toHaveBeenCalledWith(100001, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '已完成陪玩' })
      );
    });
  });

  // ==================== cancelOrder ====================
  describe('cancelOrder', () => {
    it('should reject empty orderId', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await gamesController.cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should cancel order with role', async () => {
      gamesService.cancelOrder.mockResolvedValue(true);

      const req = mockReq({ body: { orderId: 1, role: 'user' } });
      const res = mockRes();

      await gamesController.cancelOrder(req, res);

      expect(gamesService.cancelOrder).toHaveBeenCalledWith(100001, 1, 'user');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '取消成功' })
      );
    });
  });

  // ==================== getOrders ====================
  describe('getOrders', () => {
    it('should return order list with default params', async () => {
      const mockOrders = {
        list: [{ id: 1, orderNo: 'DD01', status: 0 }],
        total: 1
      };
      gamesService.getOrders.mockResolvedValue(mockOrders);

      const req = mockReq({ query: {} });
      const res = mockRes();

      await gamesController.getOrders(req, res);

      expect(gamesService.getOrders).toHaveBeenCalledWith(100001, 'user', undefined, 1, 20);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by role and status', async () => {
      gamesService.getOrders.mockResolvedValue({ list: [], total: 0 });

      const req = mockReq({ query: { role: 'companion', status: '2', page: '2' } });
      const res = mockRes();

      await gamesController.getOrders(req, res);

      expect(gamesService.getOrders).toHaveBeenCalledWith(100001, 'companion', 2, 2, 20);
    });
  });

  // ==================== applyAsCompanion ====================
  describe('applyAsCompanion', () => {
    it('should reject empty gameId or price', async () => {
      const req = mockReq({ body: { gameId: 1 } });
      const res = mockRes();

      await gamesController.applyAsCompanion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should submit application successfully', async () => {
      gamesService.applyAsCompanion.mockResolvedValue(true);

      const req = mockReq({
        body: { gameId: 1, price: 30, tags: ['技术流', '温柔'] }
      });
      const res = mockRes();

      await gamesController.applyAsCompanion(req, res);

      expect(gamesService.applyAsCompanion).toHaveBeenCalledWith(100001, 1, 30, ['技术流', '温柔']);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '申请已提交，等待审核' })
      );
    });
  });

  // ==================== getApplyStatus ====================
  describe('getApplyStatus', () => {
    it('should return application status', async () => {
      const mockStatus = { status: 'pending', gameId: 1 };
      gamesService.getApplyStatus.mockResolvedValue(mockStatus);

      const req = mockReq();
      const res = mockRes();

      await gamesController.getApplyStatus(req, res);

      expect(gamesService.getApplyStatus).toHaveBeenCalledWith(100001);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle error', async () => {
      gamesService.getApplyStatus.mockRejectedValue(new Error('查询失败'));

      const req = mockReq();
      const res = mockRes();

      await gamesController.getApplyStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
