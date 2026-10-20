jest.mock('../../../src/models', () => ({
  Notice: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

const { Notice } = require('../../../src/models');
const { Op } = require('sequelize');
const noticeService = require('../../../src/services/noticeService');

const row = (overrides = {}) => ({
  id: 1,
  title: '维护通知',
  content: '今晚 12 点维护',
  type: 'notice',
  status: 1,
  pinned: 0,
  start_time: 0,
  end_time: 0,
  create_time: 1000,
  update_time: 1000,
  ...overrides
});

describe('Service - noticeService（B-3/B-4 公告落库）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listActive（C 端）', () => {
    it('只查已发布且在有效期内的公告，置顶优先', async () => {
      Notice.findAndCountAll.mockResolvedValue({ count: 1, rows: [row({ pinned: 1, type: 'activity' })] });

      const result = await noticeService.listActive({ page: 1, pageSize: 10 });

      const opts = Notice.findAndCountAll.mock.calls[0][0];
      expect(opts.where.status).toBe(1);
      expect(opts.order).toEqual([['pinned', 'DESC'], ['create_time', 'DESC']]);
      expect(opts.limit).toBe(10);
      // 时间窗口条件：start_time=0 或 <=now，end_time=0 或 >=now
      expect(opts.where[Op.and]).toHaveLength(2);
      expect(result.list[0]).toMatchObject({ id: 1, title: '维护通知', type: 'activity', pinned: 1 });
      expect(result.pagination).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
    });
  });

  describe('listForAdmin（后台）', () => {
    it('按状态与标题关键词筛选', async () => {
      Notice.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await noticeService.listForAdmin({ status: '0', keyword: '维护', page: 2, pageSize: 5 });

      const opts = Notice.findAndCountAll.mock.calls[0][0];
      expect(opts.where.status).toBe(0);
      expect(opts.where.title).toEqual({ [Op.like]: '%维护%' });
      expect(opts.offset).toBe(5);
    });

    it('非法状态返回 INVALID_STATUS', async () => {
      await expect(noticeService.listForAdmin({ status: '9' })).rejects.toMatchObject({ code: 'INVALID_STATUS' });
    });
  });

  describe('getNotice', () => {
    it('不存在返回 NOTICE_NOT_FOUND', async () => {
      Notice.findByPk.mockResolvedValue(null);
      await expect(noticeService.getNotice(9)).rejects.toMatchObject({ code: 'NOTICE_NOT_FOUND' });
    });
  });

  describe('createNotice', () => {
    it('缺标题/正文返回 INVALID_PAYLOAD', async () => {
      await expect(noticeService.createNotice({ content: 'x' }, 1)).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
      await expect(noticeService.createNotice({ title: 'x' }, 1)).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    });

    it('正文超长返回 INVALID_PAYLOAD', async () => {
      await expect(noticeService.createNotice({ title: 'x', content: 'a'.repeat(5001) }, 1)).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    });

    it('未知类型归一到 notice，并按创建时间落库', async () => {
      Notice.create.mockImplementation(async (data) => row({ ...data, id: 5 }));

      const result = await noticeService.createNotice({ title: ' t ', content: ' c ', type: 'weird', pinned: true }, 3);

      const created = Notice.create.mock.calls[0][0];
      expect(created.title).toBe('t');
      expect(created.content).toBe('c');
      expect(created.type).toBe('notice');
      expect(created.pinned).toBe(1);
      expect(created.creator_id).toBe(3);
      expect(created.create_time).toBeGreaterThan(0);
      expect(result).toMatchObject({ id: 5, title: 't', pinned: 1 });
    });

    it('失效时间早于生效时间返回 INVALID_PAYLOAD', async () => {
      await expect(noticeService.createNotice({ title: 'x', content: 'y', startTime: 200, endTime: 100 }, 1))
        .rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    });
  });

  describe('updateNotice', () => {
    it('部分更新保留未传字段（只改状态不清空正文）', async () => {
      // Sequelize 实例的 update 会就地合并字段，这里用同样的语义模拟
      const base = row();
      const update = jest.fn(async (patch) => Object.assign(base, patch));
      base.update = update;
      Notice.findByPk.mockResolvedValue(base);

      const result = await noticeService.updateNotice(1, { status: 0 });

      const patch = update.mock.calls[0][0];
      expect(patch.status).toBe(0);
      expect(patch.title).toBe('维护通知');
      expect(patch.content).toBe('今晚 12 点维护');
      expect(result.status).toBe(0);
    });

    it('不存在返回 NOTICE_NOT_FOUND', async () => {
      Notice.findByPk.mockResolvedValue(null);
      await expect(noticeService.updateNotice(9, { status: 0 })).rejects.toMatchObject({ code: 'NOTICE_NOT_FOUND' });
    });
  });

  describe('deleteNotice', () => {
    it('删除成功返回 id', async () => {
      const destroy = jest.fn().mockResolvedValue(true);
      Notice.findByPk.mockResolvedValue(row({ destroy }));
      const result = await noticeService.deleteNotice(1);
      expect(destroy).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, deleted: true });
    });

    it('不存在返回 NOTICE_NOT_FOUND', async () => {
      Notice.findByPk.mockResolvedValue(null);
      await expect(noticeService.deleteNotice(9)).rejects.toMatchObject({ code: 'NOTICE_NOT_FOUND' });
    });
  });
});
