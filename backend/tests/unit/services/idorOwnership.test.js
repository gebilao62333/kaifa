// 第二轮审计 B-11 ~ B-14：越权访问（IDOR）回归测试
// 四个详情类接口此前不校验归属，任何登录用户都能按 ID 读取他人订单/预约/VIP 订单，
// 需求详情还会把发布者的线下地址返回给所有人。这里把归属规则固化下来。
jest.mock('../../../src/models', () => {
  const model = () => ({
    findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(),
    create: jest.fn(), update: jest.fn(), destroy: jest.fn(), increment: jest.fn(),
    decrement: jest.fn(), count: jest.fn(), sum: jest.fn(), upsert: jest.fn()
  });
  return {
    Game: model(), CompanionProfile: model(), GameOrder: model(), User: model(),
    Reserve: model(), ReserveSlot: model(), VipPackage: model(), VipOrder: model(), Demand: model()
  };
});
jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn(() => Promise.resolve({ commit: jest.fn(), rollback: jest.fn(), finished: false })),
  literal: jest.fn((s) => s),
  query: jest.fn()
}));

const gamesService = require('../../../src/services/gamesService');
const reserveService = require('../../../src/services/reserveService');
const vipService = require('../../../src/services/vipService');
const demandService = require('../../../src/services/demandService');
const { GameOrder, Reserve, VipOrder, Demand, User, Game } = require('../../../src/models');

describe('IDOR 归属校验（B-11 ~ B-14）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findByPk.mockResolvedValue({ id: 2, nickname: 'n', avatar: 'a' });
    Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });
  });

  describe('B-11 游戏订单详情', () => {
    beforeEach(() => {
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, status: 0, price: 1, num: 1, total_price: 1 });
    });

    it('非买卖双方读取被拒绝', async () => {
      await expect(gamesService.getOrderDetail(1, 999)).rejects.toThrow('无权查看此订单');
    });

    it('买家与接单方均可读取', async () => {
      await expect(gamesService.getOrderDetail(1, 2)).resolves.toBeTruthy();
      await expect(gamesService.getOrderDetail(1, 3)).resolves.toBeTruthy();
    });
  });

  describe('B-13 预约详情', () => {
    beforeEach(() => {
      Reserve.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 3, game_id: 1, status: 0, price: 1, duration: 1 });
    });

    it('非预约双方读取被拒绝', async () => {
      await expect(reserveService.getReserveDetail(1, 999)).rejects.toThrow('无权查看此预约');
    });

    it('预约双方可读取', async () => {
      await expect(reserveService.getReserveDetail(1, 2)).resolves.toBeTruthy();
    });
  });

  describe('B-12 VIP 订单状态', () => {
    beforeEach(() => {
      VipOrder.findOne.mockResolvedValue({ order_no: 'V1', user_id: 2, status: 1, price: 10, pay_time: 0 });
    });

    it('非本人查询被拒绝', async () => {
      await expect(vipService.getVipOrderStatus('V1', 999)).rejects.toThrow('无权查看此订单');
    });

    it('本人可查询', async () => {
      await expect(vipService.getVipOrderStatus('V1', 2)).resolves.toMatchObject({ orderNo: 'V1' });
    });
  });

  describe('B-14 需求详情线下地址可见性', () => {
    const baseDemand = {
      id: 1, user_id: 2, service_type: 1, game_id: 1, game_name: 'g',
      date: '2026-10-03', start_time: '10:00', end_time: '12:00', duration: 2,
      budget: 100, remark: '', offline_location: '北京市朝阳区XX路1号', gender: 0,
      age_start: 0, age_end: 0, tags: null, status: 0, create_time: 0, update_time: 0
    };

    it('非发布者看不到线下地址', async () => {
      Demand.findByPk.mockResolvedValue({ ...baseDemand });
      const detail = await demandService.getDemandDetail(1, 999);
      expect(detail.offlineLocation).toBe('');
    });

    it('发布者可见线下地址', async () => {
      Demand.findByPk.mockResolvedValue({ ...baseDemand });
      const detail = await demandService.getDemandDetail(1, 2);
      expect(detail.offlineLocation).toBe('北京市朝阳区XX路1号');
    });
  });
});
