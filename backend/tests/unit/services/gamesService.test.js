jest.mock('../../../src/models', () => {
  const model = () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    increment: jest.fn()
  });
  const User = model();
  User.sequelize = { transaction: jest.fn() };
  return { Game: model(), CompanionProfile: model(), GameOrder: model(), User };
});
jest.mock('../../../src/config/mysql', () => ({ literal: jest.fn((s) => s), transaction: jest.fn() }));
jest.mock('../../../src/services/settingsService', () => ({ getCommissionRate: jest.fn() }));

const gamesService = require('../../../src/services/gamesService');
const { Game, CompanionProfile, GameOrder, User } = require('../../../src/models');
const { getCommissionRate } = require('../../../src/services/settingsService');

const txn = () => ({ commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) });

describe('Service - GamesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.sequelize.transaction.mockResolvedValue(txn());
    getCommissionRate.mockResolvedValue(0.7);
  });

  it('getCategories maps active games', async () => {
    Game.findAll.mockResolvedValue([{ id: 1, name: '王者', image: 'i', image_bg: 'b' }]);
    const list = await gamesService.getCategories();
    expect(list[0]).toEqual({ gameId: 1, gameName: '王者', image: 'i', backgroundImage: 'b' });
  });

  describe('getCompanions', () => {
    it('maps companions with and without game filter', async () => {
      CompanionProfile.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ user_id: 2, game_id: 1, price: '30', tags: 'a,b', voice_intro: 'v', voice_time: 5, order_num: 3, star: '4.5', pingjia_num: 2 }]
      });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n', avatar: 'a', city: 'c', lv: 2, fans_num: 9 });

      const result = await gamesService.getCompanions(1, 1, 10);
      expect(result.total).toBe(1);
      expect(result.list[0].tags).toEqual(['a', 'b']);
      expect(CompanionProfile.findAndCountAll.mock.calls[0][0].where.game_id).toBe(1);

      await gamesService.getCompanions(null, 1, 10);
      expect(CompanionProfile.findAndCountAll.mock.calls[1][0].where.game_id).toBeUndefined();
    });

    it('tolerates missing users', async () => {
      CompanionProfile.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ user_id: 2, game_id: 1, price: '30', tags: null, order_num: 0, star: '0', pingjia_num: 0 }]
      });
      User.findByPk.mockResolvedValue(null);
      const result = await gamesService.getCompanions(null, 1, 10);
      expect(result.list[0].nickname).toBe('');
      expect(result.list[0].tags).toEqual([]);
    });
  });

  describe('createOrder', () => {
    it('throws when game is missing', async () => {
      Game.findByPk.mockResolvedValue(null);
      await expect(gamesService.createOrder(1, 2, 1, 1)).rejects.toThrow('游戏不存在');
    });

    it('throws when the companion profile is missing', async () => {
      Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });
      CompanionProfile.findOne.mockResolvedValue(null);
      await expect(gamesService.createOrder(1, 2, 1, 1)).rejects.toThrow('陪玩师不存在或未认证');
    });

    it('throws when a bounty order has no price', async () => {
      Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });
      await expect(gamesService.createOrder(1, 0, 1, 1)).rejects.toThrow('请填写悬赏单价');
      await expect(gamesService.createOrder(1, 0, 1, 1, 0)).rejects.toThrow('请填写悬赏单价');
    });

    it('creates a companion order and commits', async () => {
      Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });
      CompanionProfile.findOne.mockResolvedValue({ price: '30' });
      GameOrder.create.mockResolvedValue({ id: 10, order_no: 'O10' });
      User.update.mockResolvedValue([1]);
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);

      const result = await gamesService.createOrder(1, 2, 1, 2);
      expect(result).toEqual({ orderId: 10, orderNo: 'O10', totalPrice: 60 });
      expect(tx.commit).toHaveBeenCalled();
    });

    it('creates a bounty order and rolls back on insufficient balance', async () => {
      Game.findByPk.mockResolvedValue({ id: 1, name: 'g' });
      GameOrder.create.mockResolvedValue({ id: 11, order_no: 'O11' });
      User.update.mockResolvedValue([0]);
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);

      await expect(gamesService.createOrder(1, 0, 1, 1, 50)).rejects.toThrow('余额不足');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  it('getPool lists bounty orders', async () => {
    GameOrder.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 1, order_no: 'O1', user_id: 2, game_id: 1, game_name: 'g', price: '10', num: 1, total_price: '10', remark: '', create_time: 1 }]
    });
    User.findByPk.mockResolvedValue({ id: 2, nickname: 'n', avatar: 'a', lv: 1 });

    const result = await gamesService.getPool(1, 2, 1, 10);
    expect(result.total).toBe(1);
    expect(result.list[0].nickName).toBe('n');
    expect(GameOrder.findAndCountAll.mock.calls[0][0].where.game_id).toBe(2);
  });

  describe('grabOrder', () => {
    it('rejects missing, own, unverified and already grabbed orders', async () => {
      GameOrder.findByPk.mockResolvedValue(null);
      await expect(gamesService.grabOrder(2, 1)).rejects.toThrow('订单不存在');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, order_no: 'O1' });
      await expect(gamesService.grabOrder(2, 1)).rejects.toThrow('不能接自己发布的订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 3, order_no: 'O1' });
      CompanionProfile.findOne.mockResolvedValue(null);
      await expect(gamesService.grabOrder(2, 1)).rejects.toThrow('您不是在线接单的陪玩师');

      CompanionProfile.findOne.mockResolvedValue({ status: 1 });
      await expect(gamesService.grabOrder(2, 1)).rejects.toThrow('您不是在线接单的陪玩师');

      CompanionProfile.findOne.mockResolvedValue({ status: 2 });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      GameOrder.update.mockResolvedValue([0]);
      await expect(gamesService.grabOrder(2, 1)).rejects.toThrow('订单已被抢或已取消');
    });

    it('grabs an order atomically', async () => {
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 3, order_no: 'O1' });
      CompanionProfile.findOne.mockResolvedValue({ status: 2 });
      User.findByPk.mockResolvedValue({ id: 2, nickname: 'n' });
      GameOrder.update.mockResolvedValue([1]);

      const result = await gamesService.grabOrder(2, 1);
      expect(result).toEqual({ orderId: 1, orderNo: 'O1' });
    });
  });

  describe('startOrder', () => {
    it('validates order ownership and status', async () => {
      GameOrder.findByPk.mockResolvedValue(null);
      await expect(gamesService.startOrder(2, 1)).rejects.toThrow('订单不存在');

      GameOrder.findByPk.mockResolvedValue({ id: 1, target_user_id: 3, status: 1 });
      await expect(gamesService.startOrder(2, 1)).rejects.toThrow('无权操作此订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 0 });
      await expect(gamesService.startOrder(2, 1)).rejects.toThrow('订单状态不正确');
    });

    it('starts the order', async () => {
      const update = jest.fn().mockResolvedValue(true);
      GameOrder.findByPk.mockResolvedValue({ id: 1, target_user_id: 2, status: 1, update });
      await expect(gamesService.startOrder(2, 1)).resolves.toBe(true);
      expect(update).toHaveBeenCalledWith({ status: 2 });
    });
  });

  describe('completeOrder', () => {
    it('validates ownership and status', async () => {
      GameOrder.findByPk.mockResolvedValue(null);
      await expect(gamesService.completeOrder(2, 1)).rejects.toThrow('订单不存在');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 3, status: 2 });
      await expect(gamesService.completeOrder(2, 1)).rejects.toThrow('无权操作此订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 1 });
      await expect(gamesService.completeOrder(2, 1)).rejects.toThrow('订单状态不正确');
    });

    it('splits income with and without a companion profile', async () => {
      const update = jest.fn().mockResolvedValue(true);
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 2, target_user_id: 3, total_price: '100', update });
      CompanionProfile.findOne.mockResolvedValue({ income_total: 5, order_num: 1, update: jest.fn().mockResolvedValue(true) });
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);

      await expect(gamesService.completeOrder(2, 1)).resolves.toBe(true);
      expect(User.increment).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenCalled();

      CompanionProfile.findOne.mockResolvedValue(null);
      User.sequelize.transaction.mockResolvedValue(txn());
      await expect(gamesService.completeOrder(2, 1)).resolves.toBe(true);
    });

    it('skips increments when there is no companion id', async () => {
      const update = jest.fn().mockResolvedValue(true);
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 2, target_user_id: 0, companion_id: 0, total_price: '100', update });
      CompanionProfile.findOne.mockResolvedValue(null);
      User.sequelize.transaction.mockResolvedValue(txn());

      await expect(gamesService.completeOrder(2, 1)).resolves.toBe(true);
      expect(User.increment).not.toHaveBeenCalled();
    });

    it('rolls back on failure', async () => {
      const update = jest.fn().mockRejectedValue(new Error('db'));
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 2, target_user_id: 3, total_price: '100', update });
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);

      await expect(gamesService.completeOrder(2, 1)).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  describe('appealOrder', () => {
    it('validates and appeals', async () => {
      GameOrder.findByPk.mockResolvedValue(null);
      await expect(gamesService.appealOrder(2, 1)).rejects.toThrow('订单不存在');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 3, status: 1 });
      await expect(gamesService.appealOrder(2, 1)).rejects.toThrow('无权操作此订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 4 });
      await expect(gamesService.appealOrder(2, 1)).rejects.toThrow('当前订单状态不可申诉');

      const update = jest.fn().mockResolvedValue(true);
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 1, update });
      await expect(gamesService.appealOrder(2, 1, 'reason')).resolves.toBe(true);
      expect(update).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('validates role and status', async () => {
      GameOrder.findByPk.mockResolvedValue(null);
      await expect(gamesService.cancelOrder(2, 1, 'user')).rejects.toThrow('订单不存在');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 3, status: 0 });
      await expect(gamesService.cancelOrder(2, 1, 'user')).rejects.toThrow('无权操作此订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 1, target_user_id: 3, status: 0 });
      await expect(gamesService.cancelOrder(2, 1, 'companion')).rejects.toThrow('无权操作此订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 2, status: 3 });
      await expect(gamesService.cancelOrder(2, 1, 'user')).rejects.toThrow('订单无法取消');
    });

    it('refunds and commits', async () => {
      const update = jest.fn().mockResolvedValue(true);
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 2, status: 0, total_price: '50', update });
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);
      User.increment.mockResolvedValue([1]);
      // 审计 B-02：取消改为事务内条件更新，affected=1 表示确实取消成功
      GameOrder.update.mockResolvedValue([1]);

      await expect(gamesService.cancelOrder(2, 1, 'user')).resolves.toBe(true);
      expect(GameOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 4 }),
        expect.objectContaining({ where: expect.objectContaining({ status: expect.anything() }) })
      );
      expect(User.increment).toHaveBeenCalled();
      expect(tx.commit).toHaveBeenCalled();
    });

    it('rolls back on failure', async () => {
      GameOrder.update.mockRejectedValue(new Error('db'));
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, target_user_id: 2, status: 0, total_price: '50', update: jest.fn() });
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);
      await expect(gamesService.cancelOrder(2, 1, 'companion')).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  it('getOrders filters by role and status', async () => {
    GameOrder.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 1, order_no: 'O1', user_id: 2, target_user_id: 3, game_id: 1, game_name: 'g', price: '10', num: 1, total_price: '10', status: 1, create_time: 1 }]
    });
    User.findByPk.mockResolvedValue({ id: 3, nickname: 'n', avatar: 'a' });

    await gamesService.getOrders(2, 'companion', 1, 1, 10);
    expect(GameOrder.findAndCountAll.mock.calls[0][0].where.target_user_id).toBe(2);
    expect(GameOrder.findAndCountAll.mock.calls[0][0].where.status).toBe(1);

    await gamesService.getOrders(2, 'user', null, 1, 10);
    expect(GameOrder.findAndCountAll.mock.calls[1][0].where.user_id).toBe(2);
    expect(GameOrder.findAndCountAll.mock.calls[1][0].where.status).toBeUndefined();
  });

  describe('applyAsCompanion', () => {
    it('rejects pending and already-certified applications', async () => {
      CompanionProfile.findOne.mockResolvedValue({ status: 1 });
      await expect(gamesService.applyAsCompanion(2, 1, 30, 'a')).rejects.toThrow('申请正在审核中');

      CompanionProfile.findOne.mockResolvedValue({ status: 2 });
      await expect(gamesService.applyAsCompanion(2, 1, 30, 'a')).rejects.toThrow('您已经是认证陪玩师');
    });

    it('updates an existing rejected application', async () => {
      const update = jest.fn().mockResolvedValue(true);
      CompanionProfile.findOne.mockResolvedValue({ status: 0, update });
      await expect(gamesService.applyAsCompanion(2, 1, 30, 'a', { icon: 'i', description: 'd', voiceIntro: 'v', voiceTime: '5' })).resolves.toBe(true);
      expect(update).toHaveBeenCalled();
    });

    it('creates a new application', async () => {
      CompanionProfile.findOne.mockResolvedValue(null);
      CompanionProfile.create.mockResolvedValue({ id: 1 });
      await expect(gamesService.applyAsCompanion(2, 1, 30, 'a')).resolves.toBe(true);
      expect(CompanionProfile.create).toHaveBeenCalled();
    });
  });

  it('getApplyStatus handles missing and existing profiles', async () => {
    CompanionProfile.findOne.mockResolvedValue(null);
    expect(await gamesService.getApplyStatus(2)).toEqual({ status: 0 });

    CompanionProfile.findOne.mockResolvedValue({ status: 2, game_id: 1, price: '30', tags: 'a,b' });
    const result = await gamesService.getApplyStatus(2);
    expect(result.tags).toEqual(['a', 'b']);
  });

  it('searchCompanions supports keyword and embedded user', async () => {
    CompanionProfile.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ user_id: 2, game_id: 1, price: '30', tags: 'a', user: { nickname: 'n' }, order_num: 0, star: '5', pingjia_num: 0 }]
    });
    const result = await gamesService.searchCompanions('a', 1, 1, 10);
    expect(result.list[0].nickname).toBe('n');
    expect(CompanionProfile.findAndCountAll.mock.calls[0][0].where[require('sequelize').Op.or]).toBeDefined();
  });

  it('getCompanionDetail throws when missing', async () => {
    CompanionProfile.findOne.mockResolvedValue(null);
    await expect(gamesService.getCompanionDetail(2)).rejects.toThrow('陪玩师不存在');
  });

  it('getCompanionDetail maps profile and user', async () => {
    CompanionProfile.findOne.mockResolvedValue({
      user_id: 2, game_id: 1, price: '30', tags: 'a,b', voice_intro: 'v', voice_time: 3,
      order_num: 1, star: '4', pingjia_num: 2, user: { nickname: 'n', avatar: 'a', city: 'c', lv: 2, fans_num: 1, sex: 1, dec: 'sig' }
    });
    const result = await gamesService.getCompanionDetail(2);
    expect(result.signature).toBe('sig');
    expect(result.gender).toBe(1);
  });

  describe('evaluateOrder', () => {
    it('validates order and rating', async () => {
      GameOrder.findByPk.mockResolvedValue(null);
      await expect(gamesService.evaluateOrder(2, 1, 5, 'ok')).rejects.toThrow('订单不存在');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 3, status: 3 });
      await expect(gamesService.evaluateOrder(2, 1, 5, 'ok')).rejects.toThrow('无权评价他人订单');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 2 });
      await expect(gamesService.evaluateOrder(2, 1, 5, 'ok')).rejects.toThrow('订单尚未完成');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 3, pingjia_status: 1 });
      await expect(gamesService.evaluateOrder(2, 1, 5, 'ok')).rejects.toThrow('该订单已评价');

      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 3, pingjia_status: 0 });
      await expect(gamesService.evaluateOrder(2, 1, 9, 'ok')).rejects.toThrow('评分需在 1-5 之间');
      await expect(gamesService.evaluateOrder(2, 1, 'abc', 'ok')).rejects.toThrow('评分需在 1-5 之间');
    });

    it('writes the rating and refreshes the profile average', async () => {
      const update = jest.fn().mockResolvedValue(true);
      GameOrder.findByPk.mockResolvedValue({ id: 1, order_no: 'O1', user_id: 2, status: 3, pingjia_status: 0, target_user_id: 3, update });
      CompanionProfile.findOne.mockResolvedValue({ pingjia_num: 1, star: '4', update: jest.fn().mockResolvedValue(true) });
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);

      const result = await gamesService.evaluateOrder(2, 1, 5, 'nice');
      expect(result.rating).toBe(5);
      expect(tx.commit).toHaveBeenCalled();
    });

    it('rolls back on failure', async () => {
      const update = jest.fn().mockRejectedValue(new Error('db'));
      GameOrder.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 3, pingjia_status: 0, target_user_id: 3, update });
      const tx = txn();
      User.sequelize.transaction.mockResolvedValue(tx);
      await expect(gamesService.evaluateOrder(2, 1, 5, 'x')).rejects.toThrow('db');
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  it('getOrderDetail throws when missing and maps otherwise', async () => {
    GameOrder.findByPk.mockResolvedValue(null);
    await expect(gamesService.getOrderDetail(1)).rejects.toThrow('订单不存在');

    GameOrder.findByPk.mockResolvedValue({ id: 1, order_no: 'O1', user_id: 2, target_user_id: 3, price: '1', total_price: '1' });
    User.findByPk.mockResolvedValueOnce({ id: 2, nickname: 'u' }).mockResolvedValueOnce({ id: 3, nickname: 't' });
    const detail = await gamesService.getOrderDetail(1);
    expect(detail.user.nickname).toBe('u');
    expect(detail.targetUser.nickname).toBe('t');
  });

  it('getStatistics computes averages', async () => {
    GameOrder.count.mockResolvedValue(2);
    GameOrder.sum.mockResolvedValue('100');
    GameOrder.findAll.mockResolvedValue([{ star: 4 }, { star: 5 }]);
    const result = await gamesService.getStatistics(2);
    expect(result.totalSpent).toBe(100);
    expect(result.avgRating).toBe('4.5');

    GameOrder.findAll.mockResolvedValue([]);
    const empty = await gamesService.getStatistics(2);
    expect(empty.avgRating).toBe(0);
  });

  it('getMyServices maps profiles', async () => {
    CompanionProfile.findAll.mockResolvedValue([{ id: 1, game_id: 2, price: '10', tags: 'a', status: 2, order_num: 1, income_total: '5', star: '4', pingjia_num: 1 }]);
    Game.findByPk.mockResolvedValue({ id: 2, name: 'g', image: 'i' });
    const result = await gamesService.getMyServices(2);
    expect(result.total).toBe(1);
    expect(result.list[0].gameName).toBe('g');
  });

  it('toggleServiceStatus switches between active and paused', async () => {
    CompanionProfile.findByPk.mockResolvedValue(null);
    await expect(gamesService.toggleServiceStatus(2, 1)).rejects.toThrow('服务不存在');

    CompanionProfile.findByPk.mockResolvedValue({ id: 1, user_id: 3, status: 2, update: jest.fn() });
    await expect(gamesService.toggleServiceStatus(2, 1)).rejects.toThrow('服务不存在');

    CompanionProfile.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 1, update: jest.fn() });
    await expect(gamesService.toggleServiceStatus(2, 1)).rejects.toThrow('当前状态不可切换');

    const update = jest.fn().mockResolvedValue(true);
    CompanionProfile.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 2, update });
    expect(await gamesService.toggleServiceStatus(2, 1)).toEqual({ serviceId: 1, status: 3 });

    CompanionProfile.findByPk.mockResolvedValue({ id: 1, user_id: 2, status: 3, update });
    expect(await gamesService.toggleServiceStatus(2, 1)).toEqual({ serviceId: 1, status: 2 });
  });
});
