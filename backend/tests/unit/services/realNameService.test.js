jest.mock('../../../src/models', () => ({
  User: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn()
  }
}));
jest.mock('../../../src/utils/pii', () => ({
  decryptField: jest.fn((v) => (v === null || v === undefined ? v : 'decrypted:' + v))
}));
jest.mock('../../../src/services/levelService', () => ({
  addExp: jest.fn()
}));

const { User } = require('../../../src/models');
const pii = require('../../../src/utils/pii');
const levelService = require('../../../src/services/levelService');
const realNameService = require('../../../src/services/realNameService');
const { Op } = require('sequelize');

const mockUser = (overrides = {}) => ({
  id: 7,
  nickname: '小明',
  avatar: 'a.png',
  lv: 3,
  real_name: '张三',
  id_card: '110101199001011234',
  real_name_front: 'https://cdn/front.png',
  real_name_back: 'https://cdn/back.png',
  real_name_status: 1,
  real_name_time: 100,
  ...overrides
});

describe('Service - realNameService（B-2 后台实名审核）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pii.decryptField.mockImplementation((v) => (v === null || v === undefined ? v : 'decrypted:' + v));
    levelService.addExp.mockResolvedValue({ added: 100, lv: 4, exp: 20, leveledUp: true });
  });

  describe('listRealNames', () => {
    it('默认只列审核中+已拒绝，并对姓名/证件号脱敏', async () => {
      User.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockUser()] });
      // 本用例只关心脱敏，mock 解密直接还原成明文姓名
      pii.decryptField.mockImplementation((v) => (String(v).includes('张三') ? '张三' : 'decrypted:' + v));

      const result = await realNameService.listRealNames({});

      const where = User.findAndCountAll.mock.calls[0][0].where;
      expect(where.real_name_status[Op.in]).toEqual([1, 3]);
      expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
      expect(result.list[0].realName).toBe('*三');
      expect(result.list[0].idCard).toContain('***********');
      // 列表只回脱敏后的身份信息，不返回证件照片
      expect(result.list[0].front).toBeUndefined();
    });

    it('按状态与关键词筛选（数字关键词同时按用户ID精确匹配）', async () => {
      User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await realNameService.listRealNames({ status: '2', keyword: '10086', page: 2, pageSize: 10 });

      const opts = User.findAndCountAll.mock.calls[0][0];
      expect(opts.where.real_name_status).toBe(2);
      expect(opts.limit).toBe(10);
      expect(opts.offset).toBe(10);
      expect(opts.where[Op.or]).toEqual([
        { id: 10086 },
        { nickname: { [Op.like]: '%10086%' } }
      ]);
    });

    it('非法状态值返回 INVALID_ACTION', async () => {
      await expect(realNameService.listRealNames({ status: '9' })).rejects.toMatchObject({ code: 'INVALID_ACTION' });
    });
  });

  describe('getRealNameDetail', () => {
    it('用户不存在返回 USER_NOT_FOUND', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(realNameService.getRealNameDetail(99)).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
    });

    it('返回解密后的证件照 URL', async () => {
      User.findByPk.mockResolvedValue(mockUser());
      const detail = await realNameService.getRealNameDetail(7);
      expect(detail.front).toBe('decrypted:https://cdn/front.png');
      expect(detail.back).toBe('decrypted:https://cdn/back.png');
    });
  });

  describe('reviewRealName', () => {
    it('通过：条件更新（仅 1/3）+ 发放一次实名经验', async () => {
      User.findByPk.mockResolvedValue({ id: 7, real_name_status: 1 });
      User.update.mockResolvedValue([1]);

      const result = await realNameService.reviewRealName(7, 'approve');

      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({ real_name_status: 2 }),
        expect.objectContaining({ where: expect.objectContaining({ id: 7 }) })
      );
      expect(levelService.addExp).toHaveBeenCalledWith(7, 'real_name_verified');
      expect(result).toMatchObject({ userId: 7, status: 2, expGranted: true });
    });

    it('已认证用户重复审核：409 语义且不重复加经验', async () => {
      User.findByPk.mockResolvedValue({ id: 7, real_name_status: 2 });

      await expect(realNameService.reviewRealName(7, 'approve')).rejects.toMatchObject({ code: 'ALREADY_VERIFIED' });
      expect(User.update).not.toHaveBeenCalled();
      expect(levelService.addExp).not.toHaveBeenCalled();
    });

    it('并发下条件更新未命中：不重复加经验', async () => {
      User.findByPk.mockResolvedValue({ id: 7, real_name_status: 1 });
      User.update.mockResolvedValue([0]);

      await expect(realNameService.reviewRealName(7, 'approve')).rejects.toMatchObject({ code: 'ALREADY_VERIFIED' });
      expect(levelService.addExp).not.toHaveBeenCalled();
    });

    it('拒绝：状态置 3，不发经验', async () => {
      User.findByPk.mockResolvedValue({ id: 7, real_name_status: 1 });
      User.update.mockResolvedValue([1]);

      const result = await realNameService.reviewRealName(7, 'reject');

      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({ real_name_status: 3 }),
        expect.any(Object)
      );
      expect(levelService.addExp).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: 3, expGranted: false });
    });

    it('未提交实名的用户不可审核', async () => {
      User.findByPk.mockResolvedValue({ id: 7, real_name_status: 0 });
      await expect(realNameService.reviewRealName(7, 'approve')).rejects.toMatchObject({ code: 'NOT_REVIEWABLE' });
    });

    it('非法动作返回 INVALID_ACTION', async () => {
      await expect(realNameService.reviewRealName(7, 'pass')).rejects.toMatchObject({ code: 'INVALID_ACTION' });
    });

    it('经验发放失败不回滚审核结果（expGranted=false）', async () => {
      User.findByPk.mockResolvedValue({ id: 7, real_name_status: 1 });
      User.update.mockResolvedValue([1]);
      levelService.addExp.mockRejectedValue(new Error('db down'));

      const result = await realNameService.reviewRealName(7, 'approve');
      expect(result).toMatchObject({ status: 2, expGranted: false, exp: null });
    });
  });
});
