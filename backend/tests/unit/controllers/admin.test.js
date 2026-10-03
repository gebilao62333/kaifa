process.env.ADMIN_USERNAME = 'envadmin';
process.env.ADMIN_PASSWORD = 'envpass';

const adminController = require('../../../src/controllers/admin');

jest.mock('bcryptjs');
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    jwt: { expiresIn: '7d', refreshExpiresIn: '30d', secret: 's' },
    admin: { emergencyLogin: false },
    paths: { logs: path.join(os.tmpdir(), 'dsh-admin-test-logs') }
  };
});
jest.mock('../../../src/config/jwt', () => ({ signToken: jest.fn(() => 'tok'), verifyToken: jest.fn() }));
jest.mock('../../../src/config/mysql', () => ({
  query: jest.fn(),
  literal: jest.fn((s) => s),
  transaction: jest.fn(),
  QueryTypes: { SELECT: 'SELECT' }
}));
jest.mock('../../../src/services/virtualUserService', () => ({
  getAllVirtualUsers: jest.fn(),
  getVirtualUserById: jest.fn(),
  createVirtualUser: jest.fn(),
  updateVirtualUser: jest.fn(),
  deleteVirtualUser: jest.fn()
}));
jest.mock('../../../src/models', () => {
  const model = () => ({
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    upsert: jest.fn()
  });
  return {
    User: model(), GameOrder: model(), Withdraw: model(), GiftLog: model(),
    Post: model(), VipPackage: model(), RechargePackage: model(), Banner: model(),
    SplashScreen: model(), CompanionProfile: model(), Game: model(), OrderChong: model(),
    Report: model(), Admin: model(), AdminRole: model(), SystemSettings: model(),
    VirtualChatHistory: model(), Gift: model(), Card: model()
  };
});

const bcrypt = require('bcryptjs');
const config = require('../../../src/config');
const sequelize = require('../../../src/config/mysql');
const virtualUserService = require('../../../src/services/virtualUserService');
const {
  User, GameOrder, Withdraw, GiftLog, Post, VipPackage, RechargePackage, Banner,
  SplashScreen, CompanionProfile, Game, OrderChong, Report, Admin, AdminRole,
  SystemSettings, VirtualChatHistory, Gift, Card
} = require('../../../src/models');

afterAll(() => {
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
});

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const row = (over = {}) => {
  const base = {
    id: 1, user_id: 2, target_user_id: 3, order_no: 'O1', amount: '10', money: '10',
    pay_money: '10', shouxufei: '1', price: '10', total_price: '10', value: '10',
    status: 1, create_time: 1700000000, update_time: 1700000000, pay_time: 1700000000,
    title: 't', name: 'n', image: 'i', images: 'a.jpg,b.jpg', thumb_num: 1, comment_num: 1,
    share_num: 0, is_check: 0, type: 1, content: 'c', gift_name: 'g', gift_num: 2,
    gift_image: '', totalmoney: '20', song_user_id: 4, song_user_nickname: 's', user_nickname: 'r',
    pay_type: 'wechat', coins: 10, card_no: 'DK1', card_password: 'PW', admin_id: 1,
    admin_name: 'a', link_url: 'l', link: 'l', sort_order: 1, sort: 1, frequency: 1,
    start_time: 0, end_time: 0, created_at: 1700000000, original_price: '20',
    duration: 30, description: 'd', bonus_coins: 5, hot: 0, target_type: 1, target_id: 3,
    reason: 'r', handle_result: '', handle_time: 0, game_id: 1, game_name: 'g',
    num: 1, cancel_time: 0, remark: '', companion_id: 3, companion_name: 'c',
    fans_num: 0, follow_num: 0, vip: 0, vip_lv: 0, gift_money: 0, sex: 0, city: 'sz',
    dec: '', email: '', username: 'u', nickname: 'n', avatar: 'a', phone: '138',
    mobile: '138', lv: 1, real_name: 'x', id_card: 'y',
    destroy: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    toJSON() { const o = { ...this }; delete o.toJSON; return o; }
  };
  return { ...base, ...over };
};

describe('Controller - Admin (admin.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.admin.emergencyLogin = false;
    // 常用安全默认值
    User.findAll.mockResolvedValue([]);
    CompanionProfile.findOne.mockResolvedValue(null);
    AdminRole.findByPk.mockResolvedValue(null);
    AdminRole.findOne.mockResolvedValue(null);
    Admin.findOne.mockResolvedValue(null);
  });

  describe('adminLogin', () => {
    it('errors when credentials are missing', async () => {
      const res = mockRes();
      await adminController.adminLogin(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('logs in an enabled admin with valid password', async () => {
      Admin.findOne.mockResolvedValue({ id: 1, username: 'admin', status: 1, password: 'h', role_id: 2, nickname: 'n' });
      bcrypt.compare.mockResolvedValue(true);
      AdminRole.findByPk.mockResolvedValue({ id: 2, is_super: 1, permissions: '[]' });
      const res = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'admin', password: 'p' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('logs in via role account', async () => {
      Admin.findOne.mockResolvedValue(null);
      AdminRole.findOne.mockResolvedValue({ id: 7, username: 'role', status: 1, password: 'h', name: 'r', permissions: '[]', is_super: 0 });
      bcrypt.compare.mockResolvedValue(true);
      const res = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'role', password: 'p' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects disabled admin and wrong password', async () => {
      Admin.findOne.mockResolvedValue({ id: 1, username: 'a', status: 0, password: 'h' });
      const disabled = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'a', password: 'p' } }), disabled);
      expect(disabled.status).toHaveBeenCalledWith(401);

      Admin.findOne.mockResolvedValue({ id: 1, username: 'a', status: 1, password: 'h', role_id: null });
      bcrypt.compare.mockResolvedValue(false);
      const wrong = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'a', password: 'p' } }), wrong);
      expect(wrong.status).toHaveBeenCalledWith(401);
    });

    it('rejects when db fails and emergency login disabled', async () => {
      Admin.findOne.mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'envadmin', password: 'envpass' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('supports env fallback when emergency login enabled', async () => {
      config.admin.emergencyLogin = true;
      Admin.findOne.mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'envadmin', password: 'envpass' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 401 with wrong env credentials', async () => {
      config.admin.emergencyLogin = true;
      Admin.findOne.mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await adminController.adminLogin(mockReq({ body: { username: 'envadmin', password: 'nope' } }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ============ 通用 CRUD 帮助函数 ============
  const runList = (name, Model, query = {}, errorStatus = 500) => {
    describe(name, () => {
      it('returns a paginated list', async () => {
        Model.findAndCountAll.mockResolvedValue({ count: 1, rows: [row()] });
        User.findAll.mockResolvedValue([{ id: 2, nickname: 'u' }, { id: 3, nickname: 'v' }]);
        const res = mockRes();
        await adminController[name](mockReq({ query }), res);
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('handles db failure', async () => {
        Model.findAndCountAll.mockRejectedValue(new Error('db'));
        const res = mockRes();
        await adminController[name](mockReq({ query }), res);
        expect(res.status).toHaveBeenCalledWith(errorStatus);
      });
    });
  };

  const runDetail = (name, Model) => {
    describe(name, () => {
      it('returns the record', async () => {
        Model.findByPk.mockResolvedValue(row());
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' } }), res);
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('returns 404 when missing', async () => {
        Model.findByPk.mockResolvedValue(null);
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
      });

      it('returns 500 on db failure', async () => {
        Model.findByPk.mockRejectedValue(new Error('db'));
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  };

  const runCreate = (name, Model, body, expected = 200) => {
    describe(name, () => {
      it('creates a record', async () => {
        Model.create.mockResolvedValue(row());
        const res = mockRes();
        await adminController[name](mockReq({ body }), res);
        expect(res.status).toHaveBeenCalledWith(expected);
      });

      it('returns 500 on db failure', async () => {
        Model.create.mockRejectedValue(new Error('db'));
        const res = mockRes();
        await adminController[name](mockReq({ body }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  };

  const runUpdate = (name, Model, body) => {
    describe(name, () => {
      it('returns 404 when missing', async () => {
        Model.findByPk.mockResolvedValue(null);
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' }, body }), res);
        expect(res.status).toHaveBeenCalledWith(404);
      });

      it('updates successfully', async () => {
        Model.findByPk.mockResolvedValue(row());
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' }, body }), res);
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });
  };

  const runDelete = (name, Model) => {
    describe(name, () => {
      it('returns 404 when missing', async () => {
        Model.findByPk.mockResolvedValue(null);
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
      });

      it('deletes successfully', async () => {
        Model.findByPk.mockResolvedValue(row());
        Model.destroy.mockResolvedValue(1);
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' } }), res);
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });
  };

  const runStatus = (name, Model) => {
    describe(name, () => {
      it('returns 404 when missing', async () => {
        Model.findByPk.mockResolvedValue(null);
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' }, body: { status: 0 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
      });

      it('rejects missing status', async () => {
        Model.findByPk.mockResolvedValue(row());
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' }, body: {} }), res);
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('updates status', async () => {
        Model.findByPk.mockResolvedValue(row());
        const res = mockRes();
        await adminController[name](mockReq({ params: { id: '1' }, body: { status: 0 } }), res);
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });
  };

  // ============ 列表接口 ============
  runList('getUserList', User);
  runList('getUserList', User, { nickname: 'a', phone: '1', status: '1' });
  runList('getOrderList', GameOrder);
  runList('getOrderList', GameOrder, { orderNo: 'O', userId: '2', status: '1' });
  runList('getWithdrawList', Withdraw);
  runList('getWithdrawList', Withdraw, { userId: '2', status: 'pending' });
  runList('getPostList', Post);
  runList('getPostList', Post, { keyword: 'k' });
  runList('getReportList', Report, {}, 200);
  runList('getReportList', Report, { status: '1', type: '2', keyword: 'k' }, 200);
  runList('getBannerList', Banner);
  runList('getBannerList', Banner, { status: '1', keyword: 'k' });
  runList('getSplashList', SplashScreen);
  runList('getSplashList', SplashScreen, { status: '1', keyword: 'k' });
  runList('getVipPackageList', VipPackage);
  runList('getVipPackageList', VipPackage, { status: '1', keyword: 'k' });
  runList('getRechargePackageList', RechargePackage);
  runList('getRechargePackageList', RechargePackage, { status: '1', keyword: 'k' });
  runList('getGiftLogList', GiftLog);
  runList('getGiftLogList', GiftLog, { userId: '2', keyword: 'g' });
  runList('getRechargeRecordList', OrderChong);
  runList('getRechargeRecordList', OrderChong, { userId: '2', status: 'completed', keyword: 'O1' });
  runList('getGameList', Game);
  runList('getGameList', Game, { status: '1', keyword: 'k' });
  runList('getCardList', Card);
  runList('getGiftList', Gift);
  runList('getCompanionApplicationList', CompanionProfile);
  runList('getCompanionApplicationList', CompanionProfile, { status: '1', keyword: 'k' });
  runList('getVirtualUserChatHistory', VirtualChatHistory, { type: '1', userId: '2' });

  // ============ 详情接口 ============
  runDetail('getUserDetail', User);
  runDetail('getOrderDetail', GameOrder);
  runDetail('getWithdrawDetail', Withdraw);
  runDetail('getPostDetail', Post);
  runDetail('getReportDetail', Report);
  runDetail('getBannerDetail', Banner);
  runDetail('getSplashDetail', SplashScreen);
  runDetail('getVipPackageDetail', VipPackage);
  runDetail('getRechargePackageDetail', RechargePackage);
  runDetail('getGiftLogDetail', GiftLog);
  runDetail('getRechargeRecordDetail', OrderChong);
  runDetail('getGameDetail', Game);
  runDetail('getCompanionApplicationDetail', CompanionProfile);

  it('getGiftDetail returns record, 404 and 500', async () => {
    Gift.findByPk.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.getGiftDetail(mockReq({ params: { id: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    Gift.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.getGiftDetail(mockReq({ params: { id: '1' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    Gift.findByPk.mockRejectedValue(new Error('db'));
    const err = mockRes();
    await adminController.getGiftDetail(mockReq({ params: { id: '1' } }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('getVirtualUserDetail returns record and maps error to 404', async () => {
    virtualUserService.getVirtualUserById.mockResolvedValue({ id: 1 });
    const ok = mockRes();
    await adminController.getVirtualUserDetail(mockReq({ params: { id: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    virtualUserService.getVirtualUserById.mockRejectedValue(new Error('no'));
    const err = mockRes();
    await adminController.getVirtualUserDetail(mockReq({ params: { id: '1' } }), err);
    expect(err.status).toHaveBeenCalledWith(404);
  });

  // ============ 创建接口 ============
  runCreate('createUser', User, { nickname: 'n', phone: '1', sex: '1', vipLv: '2', money: '10', giftMoney: '1' });
  runCreate('createOrder', GameOrder, { userId: 2, gameId: 1, gameName: 'g', companionId: 3, price: 10, duration: 1 });
  // 审计 B-08：管理员建单改为事务内条件扣款，不能用通用 runCreate（它不 mock 事务/扣款）
  describe('createWithdraw', () => {
    const okTxn = () => ({ commit: jest.fn(), rollback: jest.fn(), finished: false });

    it('creates a record（扣款成功后落单）', async () => {
      sequelize.transaction.mockResolvedValue(okTxn());
      User.decrement.mockResolvedValue([1]);
      Withdraw.create.mockResolvedValue(row());
      const res = mockRes();
      await adminController.createWithdraw(mockReq({ body: { userId: 2, amount: '10', type: 1, account: 'a' } }), res);

      expect(User.decrement).toHaveBeenCalledWith('money', expect.objectContaining({ by: 10 }));
      expect(Withdraw.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('余额不足时拒绝且不落单（422）', async () => {
      sequelize.transaction.mockResolvedValue(okTxn());
      User.decrement.mockResolvedValue([0]);
      const res = mockRes();
      await adminController.createWithdraw(mockReq({ body: { userId: 2, amount: '10' } }), res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(Withdraw.create).not.toHaveBeenCalled();
    });

    it('returns 500 on db failure', async () => {
      sequelize.transaction.mockResolvedValue(okTxn());
      User.decrement.mockResolvedValue([1]);
      Withdraw.create.mockRejectedValue(new Error('db'));
      const res = mockRes();
      await adminController.createWithdraw(mockReq({ body: { userId: 2, amount: '10' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  it('createBanner validates and creates', async () => {
    const bad = mockRes();
    await adminController.createBanner(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    Banner.create.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.createBanner(mockReq({ body: { title: 't', image: 'i', link: 'l', sort: '1', status: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);
  });

  it('createSplash validates image', async () => {
    const bad = mockRes();
    await adminController.createSplash(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    SplashScreen.create.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.createSplash(mockReq({ body: { image: 'i', title: 't', frequency: '2', start_time: '1', end_time: '2', sort: '1', status: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);
  });

  it('createVipPackage validates name and price', async () => {
    const bad = mockRes();
    await adminController.createVipPackage(mockReq({ body: { name: 'n' } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    VipPackage.create.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.createVipPackage(mockReq({ body: { name: 'n', price: '10', originalPrice: '20', duration: '30', description: 'd', sort: '1', status: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);
  });

  it('createRechargePackage validates required fields', async () => {
    const bad = mockRes();
    await adminController.createRechargePackage(mockReq({ body: { name: 'n' } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    RechargePackage.create.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.createRechargePackage(mockReq({ body: { name: 'n', price: '10', coins: '100', bonusCoins: '5', hot: '1', sort: '1', status: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);
  });

  it('createGame validates name', async () => {
    const bad = mockRes();
    await adminController.createGame(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    Game.create.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.createGame(mockReq({ body: { name: 'g', icon: 'i', description: 'd', sort: '1', status: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);
  });

  it('createGift validates fields and returns 422 when missing', async () => {
    const bad = mockRes();
    await adminController.createGift(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(422);

    Gift.create.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.createGift(mockReq({ body: { title: 't', image: 'i', money: '10', type: '1', is_vip: '0', tian: '0', status: '1', sort: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);
  });

  it('createVirtualUser validates name and creates', async () => {
    const bad = mockRes();
    await adminController.createVirtualUser(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    virtualUserService.createVirtualUser.mockResolvedValue({ id: 1 });
    const ok = mockRes();
    await adminController.createVirtualUser(mockReq({ body: { name: 'v' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);

    virtualUserService.createVirtualUser.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await adminController.createVirtualUser(mockReq({ body: { name: 'v' } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  // ============ 更新接口 ============
  runUpdate('updateUser', User, { nickname: 'n', phone: '1', sex: '1', city: 'c', status: '1', vipLv: '2', money: '10', giftMoney: '1', dec: 'd', username: 'u', email: 'e' });
  runUpdate('updateBanner', Banner, { title: 't', image: 'i', link: 'l', sort: '1', status: '1' });
  runUpdate('updateSplash', SplashScreen, { title: 't', image: 'i', link: 'l', frequency: '1', start_time: '1', end_time: '2', sort: '1', status: '1' });
  runUpdate('updateVipPackage', VipPackage, { name: 'n', price: '1', originalPrice: '2', duration: '30', description: 'd', sort: '1', status: '1' });
  runUpdate('updateRechargePackage', RechargePackage, { name: 'n', price: '1', coins: '1', bonusCoins: '1', hot: '1', sort: '1', status: '1' });
  runUpdate('updateGame', Game, { name: 'g', icon: 'i', description: 'd', sort: '1', status: '1' });

  runStatus('updateBannerStatus', Banner);
  runStatus('updateSplashStatus', SplashScreen);
  runStatus('updateVipPackageStatus', VipPackage);
  runStatus('updateRechargePackageStatus', RechargePackage);
  runStatus('updateGameStatus', Game);

  it('updateUserStatus updates and handles 404', async () => {
    User.findByPk.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.updateUserStatus(mockReq({ params: { id: '1' }, body: { status: '0' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    User.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.updateUserStatus(mockReq({ params: { id: '1' }, body: { status: '0' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);
  });

  it('updateOrderStatus handles missing and each status branch', async () => {
    GameOrder.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.updateOrderStatus(mockReq({ params: { id: '1' }, body: { status: 'ongoing' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    for (const status of ['ongoing', 'completed', 'cancelled', 'other']) {
      GameOrder.findByPk.mockResolvedValue(row({ status }));
      const res = mockRes();
      await adminController.updateOrderStatus(mockReq({ params: { id: '1' }, body: { status } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    }
  });

  it('updateVirtualUser and deleteVirtualUser cover success and error', async () => {
    virtualUserService.updateVirtualUser.mockResolvedValue({ id: 1 });
    const ok = mockRes();
    await adminController.updateVirtualUser(mockReq({ params: { id: '1' }, body: { name: 'n' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    virtualUserService.updateVirtualUser.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await adminController.updateVirtualUser(mockReq({ params: { id: '1' }, body: {} }), err);
    expect(err.status).toHaveBeenCalledWith(422);

    virtualUserService.deleteVirtualUser.mockResolvedValue(true);
    const del = mockRes();
    await adminController.deleteVirtualUser(mockReq({ params: { id: '1' } }), del);
    expect(del.status).toHaveBeenCalledWith(200);

    virtualUserService.deleteVirtualUser.mockRejectedValue(new Error('bad'));
    const delErr = mockRes();
    await adminController.deleteVirtualUser(mockReq({ params: { id: '1' } }), delErr);
    expect(delErr.status).toHaveBeenCalledWith(404);
  });

  it('toggleVirtualUserStatus enables and disables', async () => {
    virtualUserService.updateVirtualUser.mockResolvedValue({ id: 1 });
    const on = mockRes();
    await adminController.toggleVirtualUserStatus(mockReq({ params: { id: '1' }, body: { status: 1 } }), on);
    expect(on.status).toHaveBeenCalledWith(200);

    const off = mockRes();
    await adminController.toggleVirtualUserStatus(mockReq({ params: { id: '1' }, body: { status: 0 } }), off);
    expect(off.status).toHaveBeenCalledWith(200);

    virtualUserService.updateVirtualUser.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await adminController.toggleVirtualUserStatus(mockReq({ params: { id: '1' }, body: { status: 1 } }), err);
    expect(err.status).toHaveBeenCalledWith(404);
  });

  it('updateGift updates, re-reads and handles 404', async () => {
    Gift.findByPk.mockResolvedValueOnce(row()).mockResolvedValueOnce(row({ title: 'new' }));
    Gift.update.mockResolvedValue([1]);
    const ok = mockRes();
    await adminController.updateGift(mockReq({ params: { id: '1' }, body: { title: 'new', money: '5' } }), ok);
    expect(Gift.update).toHaveBeenCalled();
    expect(ok.status).toHaveBeenCalledWith(200);

    Gift.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.updateGift(mockReq({ params: { id: '1' }, body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);
  });

  // ============ 删除接口 ============
  runDelete('deleteUser', User);
  runDelete('deleteOrder', GameOrder);
  runDelete('deleteWithdraw', Withdraw);
  runDelete('deletePost', Post);
  runDelete('deleteReport', Report);
  runDelete('deleteBanner', Banner);
  runDelete('deleteSplash', SplashScreen);
  runDelete('deleteVipPackage', VipPackage);
  runDelete('deleteRechargePackage', RechargePackage);
  runDelete('deleteRechargeRecord', OrderChong);
  runDelete('deleteGame', Game);
  runDelete('deleteGift', Gift);
  runDelete('deleteCompanionApplication', CompanionProfile);

  it('approveWithdraw approves pending and rejects other states', async () => {
    Withdraw.findByPk.mockResolvedValue(row({ is_check: 0 }));
    const ok = mockRes();
    await adminController.approveWithdraw(mockReq({ params: { id: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    Withdraw.findByPk.mockResolvedValue(row({ is_check: 1 }));
    const bad = mockRes();
    await adminController.approveWithdraw(mockReq({ params: { id: '1' } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    Withdraw.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.approveWithdraw(mockReq({ params: { id: '1' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);
  });

  it('rejectWithdraw rejects and validates state', async () => {
    const sequelize = require('../../../src/config/mysql');
    sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });

    Withdraw.findByPk.mockResolvedValue(row({ is_check: 0, remark: 'old' }));
    const ok = mockRes();
    await adminController.rejectWithdraw(mockReq({ params: { id: '1' }, body: { reason: 'r' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    Withdraw.findByPk.mockResolvedValue(row({ is_check: 2 }));
    const bad = mockRes();
    await adminController.rejectWithdraw(mockReq({ params: { id: '1' }, body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    Withdraw.findByPk.mockRejectedValue(new Error('db'));
    const err = mockRes();
    await adminController.rejectWithdraw(mockReq({ params: { id: '1' }, body: {} }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('rejectWithdraw 同时置 status=2，并对 gift 渠道原路退回冻结金额', async () => {
    const sequelize = require('../../../src/config/mysql');
    sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });

    const update = jest.fn().mockResolvedValue(true);
    Withdraw.findByPk.mockResolvedValue(row({ is_check: 0, channel: 'gift', money: 100, update }));
    const res = mockRes();
    await adminController.rejectWithdraw(mockReq({ params: { id: '1' }, body: { reason: 'r' } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    // walletService.sumWalletWithdraw 按 status!==2 统计已申请提现，不置 2 会永久冻结用户资产
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_check: 2, status: 2, state: 'rejected' }),
      expect.anything()
    );
    // gift 渠道申请时已扣减 gift_money，拒绝必须退回
    expect(User.increment).toHaveBeenCalledWith(
      'gift_money',
      expect.objectContaining({ by: 100, where: { id: expect.anything() } })
    );
  });

  it('rejectWithdraw 对 wallet 渠道不重复退回（余额为派生值）', async () => {
    const sequelize = require('../../../src/config/mysql');
    sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });

    const update = jest.fn().mockResolvedValue(true);
    Withdraw.findByPk.mockResolvedValue(row({ is_check: 0, channel: 'wallet', money: 100, update }));
    const res = mockRes();
    await adminController.rejectWithdraw(mockReq({ params: { id: '1' }, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(User.increment).not.toHaveBeenCalled();
  });

  it('handleReport validates status, missing report and success', async () => {
    const bad = mockRes();
    await adminController.handleReport(mockReq({ params: { id: '1' }, body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    Report.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.handleReport(mockReq({ params: { id: '1' }, body: { status: '1' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    Report.findByPk.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.handleReport(mockReq({ params: { id: '1' }, body: { status: '1', handleResult: 'ok' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('approve/reject companion applications', async () => {
    CompanionProfile.findByPk.mockResolvedValue(row());
    const ok = mockRes();
    await adminController.approveCompanionApplication(mockReq({ params: { id: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    CompanionProfile.findByPk.mockResolvedValue(row());
    const rej = mockRes();
    await adminController.rejectCompanionApplication(mockReq({ params: { id: '1' }, body: { reason: 'r' } }), rej);
    expect(rej.status).toHaveBeenCalledWith(200);

    CompanionProfile.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.rejectCompanionApplication(mockReq({ params: { id: '1' }, body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);
  });

  // ============ 系统设置 / 统计 ============
  it('getSystemSettings merges db values', async () => {
    SystemSettings.findAll.mockResolvedValue([
      { key: 'siteName', value: 'X' },
      { key: 'giftEnabled', value: 'true' },
      { key: 'withdrawMinAmount', value: '100' },
      { key: 'siteLogo', value: '' }
    ]);
    const res = mockRes();
    await adminController.getSystemSettings(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.siteName).toBe('X');
    expect(data.giftEnabled).toBe(true);
    expect(data.withdrawMinAmount).toBe(100);
  });

  it('getSystemSettings falls back to defaults on db error', async () => {
    SystemSettings.findAll.mockRejectedValue(new Error('db'));
    const res = mockRes();
    await adminController.getSystemSettings(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data._dbFallback).toBe(true);
  });

  it('updateSystemSettings upserts each key', async () => {
    SystemSettings.upsert.mockResolvedValue([{}, 1]);
    const res = mockRes();
    await adminController.updateSystemSettings(mockReq({ body: { registerEnabled: true, shareEnabled: 'false', siteName: 'X' } }), res);
    expect(SystemSettings.upsert).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateSystemSettings maps db error to 500', async () => {
    SystemSettings.upsert.mockRejectedValue(new Error('db'));
    const res = mockRes();
    await adminController.updateSystemSettings(mockReq({ body: { siteName: 'X' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getDashboardStats aggregates counts', async () => {
    User.count.mockResolvedValue(5);
    GameOrder.count.mockResolvedValue(2);
    Withdraw.sum.mockResolvedValue('100');
    Withdraw.count.mockResolvedValue(1);
    GiftLog.sum.mockResolvedValue('50');
    Post.count.mockResolvedValue(3);
    const res = mockRes();
    await adminController.getDashboardStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.totalUsers).toBe(5);
    expect(data.totalWithdraws).toBe(100);
  });

  it('getDashboardStats maps error to 500', async () => {
    User.count.mockRejectedValue(new Error('db'));
    const res = mockRes();
    await adminController.getDashboardStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getFinanceStats aggregates finance data', async () => {
    OrderChong.sum.mockResolvedValue('10');
    OrderChong.count.mockResolvedValue(2);
    Withdraw.sum.mockResolvedValue('20');
    Withdraw.count.mockResolvedValue(1);
    GameOrder.sum.mockResolvedValue('30');
    sequelize.query.mockResolvedValue([{ v: 99 }]);
    const res = mockRes();
    await adminController.getFinanceStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.totalRecharge).toBe(10);
    expect(data.totalGift).toBe(99);
    expect(data.totalVip).toBe(99);
    expect(data.totalCard).toBe(99);
  });

  it('getFinanceStats maps error to 500', async () => {
    OrderChong.sum.mockRejectedValue(new Error('db'));
    const res = mockRes();
    await adminController.getFinanceStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ============ 卡密 ============
  it('createCard validates faceValue and creates cards', async () => {
    const bad = mockRes();
    await adminController.createCard(mockReq({ body: { faceValue: 0 } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    Card.findOne.mockResolvedValue(null);
    Card.create.mockResolvedValue(row({ id: 9, card_no: 'DK9', card_password: 'PW9', card_key: '1234567890123456789012345', value: '10', coin_amount: 100 }));
    const ok = mockRes();
    await adminController.createCard(mockReq({ body: { faceValue: 10, coinAmount: 100, count: 2, adminId: 1, adminName: 'a' } }), ok);
    expect(Card.create).toHaveBeenCalledTimes(2);
    expect(ok.status).toHaveBeenCalledWith(200);
    // 回归：卡密充值依赖 card_key，落库必须是 25 位密钥
    expect(Card.create.mock.calls[0][0].card_key).toMatch(/^\d{25}$/);
    // 回归：返回给管理端的 cardKey 必须是密钥本身，而非「卡号+密码」拼接
    const created = ok.json.mock.calls[0][0];
    expect(created.data.list[0].cardKey).toMatch(/^\d{25}$/);
    expect(created.data.list[0].cardKey).not.toBe('DK9PW9');
  });

  it('deleteCard validates status', async () => {
    Card.findByPk.mockResolvedValue(null);
    const missing = mockRes();
    await adminController.deleteCard(mockReq({ params: { id: '1' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    Card.findByPk.mockResolvedValue(row({ status: 1 }));
    const used = mockRes();
    await adminController.deleteCard(mockReq({ params: { id: '1' } }), used);
    expect(used.status).toHaveBeenCalledWith(400);

    Card.findByPk.mockResolvedValue(row({ status: 0 }));
    const ok = mockRes();
    await adminController.deleteCard(mockReq({ params: { id: '1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('clearCards handles empty, filtered and error cases', async () => {
    Card.count.mockResolvedValue(0);
    const empty = mockRes();
    await adminController.clearCards(mockReq({ body: {} }), empty);
    expect(empty.status).toHaveBeenCalledWith(200);

    Card.count.mockResolvedValue(3);
    Card.destroy.mockResolvedValue(3);
    const ok = mockRes();
    await adminController.clearCards(mockReq({ body: { status: '0', adminId: '1', beforeTime: '1700000000' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    Card.count.mockRejectedValue(new Error('db'));
    const err = mockRes();
    await adminController.clearCards(mockReq({ body: {} }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('getCardAdminOptions merges admins and roles', async () => {
    Admin.findAll.mockResolvedValue([{ id: 1, username: 'a', nickname: 'n' }]);
    AdminRole.findAll.mockResolvedValue([{ id: 2, username: 'r', name: 'role' }]);
    const res = mockRes();
    await adminController.getCardAdminOptions(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.list.length).toBe(2);

    Admin.findAll.mockRejectedValue(new Error('db'));
    const err = mockRes();
    await adminController.getCardAdminOptions(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('getCardAdminStats groups by admin and type', async () => {
    Card.findAll
      .mockResolvedValueOnce([{ admin_id: 1, admin_name: 'a', total: '3', unused: '1', used: '1', expired: '1' }])
      .mockResolvedValueOnce([
        { admin_id: 1, value: '10', coin_amount: '100', status: 0, cnt: '1' },
        { admin_id: 1, value: '10', coin_amount: '100', status: 1, cnt: '1' },
        { admin_id: 1, value: '10', coin_amount: '100', status: 2, cnt: '1' }
      ]);
    Admin.findAll.mockResolvedValue([{ id: 1, username: 'a', nickname: 'n' }]);
    const res = mockRes();
    await adminController.getCardAdminStats(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.list[0].username).toBe('a');
    expect(data.list[0].types[0].total).toBe(3);

    Card.findAll.mockReset();
    Card.findAll.mockRejectedValue(new Error('db'));
    const err = mockRes();
    await adminController.getCardAdminStats(mockReq(), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('getVirtualUserList and chat history map results', async () => {
    virtualUserService.getAllVirtualUsers.mockResolvedValue({ list: [], total: 0 });
    const ok = mockRes();
    await adminController.getVirtualUserList(mockReq({ query: {} }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);

    virtualUserService.getAllVirtualUsers.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await adminController.getVirtualUserList(mockReq({ query: {} }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });
});
