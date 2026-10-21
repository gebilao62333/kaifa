// P2-8：GET /api/search/users（普通用户昵称搜索）的路由行为回归
jest.mock('../../../src/models', () => ({
  User: { findAndCountAll: jest.fn() },
  Game: { findAll: jest.fn() }
}));
jest.mock('../../../src/services', () => ({
  circleService: { searchPosts: jest.fn() }
}));
jest.mock('../../../src/utils/privacyPrefs', () => ({
  getPrivacyPrefsForUsers: jest.fn()
}));
// 简化为直通中间件：鉴权态由测试注入的 x-user-id 控制，便于覆盖「登录/未登录」两种口径
jest.mock('../../../src/middlewares', () => ({
  optionalAuth: (req, res, next) => next()
}));

const express = require('express');
const request = require('supertest');
const { Op } = require('sequelize');
const { User } = require('../../../src/models');
const { getPrivacyPrefsForUsers } = require('../../../src/utils/privacyPrefs');
const searchRouter = require('../../../src/routes/search');

const app = express();
app.use((req, res, next) => {
  const raw = req.headers['x-user-id'];
  if (raw) req.userId = Number(raw);
  next();
});
app.use('/api/search', searchRouter);

const userRow = (id, nickname, overrides = {}) => ({
  id,
  nickname,
  avatar: 'avatar-' + id + '.png',
  lv: 5,
  sex: 2,
  fans_num: 3,
  ...overrides
});
const mockResult = (rows, count = rows.length) => User.findAndCountAll.mockResolvedValue({ count, rows });
const lastFindArgs = () => User.findAndCountAll.mock.calls[User.findAndCountAll.mock.calls.length - 1][0];

describe('GET /api/search/users（P2-8）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrivacyPrefsForUsers.mockResolvedValue({});
  });

  it('缺少关键词返回 400', async () => {
    const res = await request(app).get('/api/search/users');
    expect(res.status).toBe(400);
    expect(User.findAndCountAll).not.toHaveBeenCalled();
  });

  it('按昵称模糊搜索并只下发公开字段', async () => {
    mockResult([userRow(11, '小美'), userRow(12, '小美美')]);

    const res = await request(app).get('/api/search/users').query({ keyword: ' 小美 ' });

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.list).toEqual([
      { userId: 11, nickname: '小美', avatar: 'avatar-11.png', level: 5, sex: 2, fansCount: 3 },
      { userId: 12, nickname: '小美美', avatar: 'avatar-12.png', level: 5, sex: 2, fansCount: 3 }
    ]);
    // 不返回手机号/余额等敏感字段
    expect(res.body.data.list[0]).not.toHaveProperty('mobile');
    expect(res.body.data.list[0]).not.toHaveProperty('balance');

    const args = lastFindArgs();
    expect(args.where.status).toBe(1);
    expect(args.where.nickname[Op.like]).toBe('%小美%');
    expect(args.attributes).not.toContain('mobile');
    expect(args.attributes).not.toContain('money');
  });

  it('登录后排除自己；未登录不加排除条件', async () => {
    mockResult([userRow(12, '小美')]);
    await request(app).get('/api/search/users').query({ keyword: '小美' }).set('x-user-id', '9');
    expect(lastFindArgs().where.id).toEqual({ [Op.ne]: 9 });

    await request(app).get('/api/search/users').query({ keyword: '小美' });
    expect(lastFindArgs().where.id).toBeUndefined();
  });

  it('遵守「允许被搜索」隐私开关：关闭的账号不出现在结果中', async () => {
    mockResult([userRow(11, '小美'), userRow(12, '小美美')]);
    getPrivacyPrefsForUsers.mockResolvedValue({
      11: { allowSearch: false },
      12: { allowSearch: true }
    });

    const res = await request(app).get('/api/search/users').query({ keyword: '小美' });

    expect(res.body.data.list).toHaveLength(1);
    expect(res.body.data.list[0].userId).toBe(12);
    expect(getPrivacyPrefsForUsers).toHaveBeenCalledWith([11, 12]);
  });

  it('隐私偏好读取失败时按默认公开降级，不清空结果', async () => {
    mockResult([userRow(11, '小美')]);
    getPrivacyPrefsForUsers.mockRejectedValue(new Error('pref down'));

    const res = await request(app).get('/api/search/users').query({ keyword: '小美' });
    expect(res.status).toBe(200);
    expect(res.body.data.list).toHaveLength(1);
  });

  it('分页参数夹取：page/pageSize 归一，pageSize 上限 100', async () => {
    mockResult([userRow(11, '小美')], 100);

    const res = await request(app).get('/api/search/users').query({ keyword: '小美', page: 2, pageSize: 10 });
    expect(lastFindArgs().offset).toBe(10);
    expect(lastFindArgs().limit).toBe(10);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.pageSize).toBe(10);

    await request(app).get('/api/search/users').query({ keyword: '小美', pageSize: 999 });
    expect(lastFindArgs().limit).toBe(100);
  });

  it('LIKE 通配符被转义，避免关键词里的 % / _ 扩大匹配范围', async () => {
    mockResult([userRow(11, '50%off')]);

    await request(app).get('/api/search/users').query({ keyword: '50%' });

    expect(lastFindArgs().where.nickname[Op.like]).toBe('%50\\%%');
  });

  it('数据库异常时返回 500 业务错误而不是抛出未捕获异常', async () => {
    User.findAndCountAll.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/search/users').query({ keyword: '小美' });
    expect(res.status).toBe(500);
  });
});
