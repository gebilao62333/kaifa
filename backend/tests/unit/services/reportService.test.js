/**
 * reportService 消息级举报（target_type=4）单测
 * 语义：举报即冻结该消息的自动撤回/已读销毁期限，保证管理员可核查。
 */
jest.mock('../../../src/models', () => ({
  Report: { create: jest.fn() },
  User: { findByPk: jest.fn() },
  Post: { findByPk: jest.fn() },
  PostComment: { findByPk: jest.fn() },
  ChatLog: { findByPk: jest.fn() }
}));
jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn((cb) => cb({ __tx: true }))
}));

const reportService = require('../../../src/services/reportService');
const { Report, ChatLog } = require('../../../src/models');
const sequelize = require('../../../src/config/mysql');

const buildMessage = (over = {}) => ({
  id: 501,
  fromid: 100001,
  toid: 2,
  content: '原文',
  is_del: 0,
  is_revoked: 0,
  destroy_at: 0,
  expire_at: 0,
  update: jest.fn().mockResolvedValue(true),
  ...over
});

describe('Service - reportService 聊天消息举报', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Report.create.mockResolvedValue({ id: 55 });
    sequelize.transaction.mockImplementation((cb) => cb({ __tx: true }));
  });

  it('举报对方消息：落举报并把该消息的撤回/销毁期限冻结为 0', async () => {
    const future = Math.floor(Date.now() / 1000) + 120;
    const message = buildMessage({ destroy_at: future, expire_at: future - 30 });
    ChatLog.findByPk.mockResolvedValue(message);

    const result = await reportService.createReport(2, 4, 501, '诈骗', []);

    expect(result).toEqual({ reportId: 55 });
    expect(Report.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 2,
      target_user_id: 100001,
      target_type: 4,
      target_id: 501
    }), { transaction: { __tx: true } });
    expect(message.update).toHaveBeenCalledWith({ destroy_at: 0, expire_at: 0 }, { transaction: { __tx: true } });
  });

  it('不能举报自己发送的消息', async () => {
    ChatLog.findByPk.mockResolvedValue(buildMessage({ fromid: 2, toid: 100001 }));

    await expect(reportService.createReport(2, 4, 501, '诈骗', [])).rejects.toThrow('不能举报自己发送的消息');
    expect(Report.create).not.toHaveBeenCalled();
  });

  it('不是会话参与方无权举报', async () => {
    ChatLog.findByPk.mockResolvedValue(buildMessage());

    await expect(reportService.createReport(999, 4, 501, '诈骗', [])).rejects.toThrow('无权举报该消息');
  });

  it('已销毁 / 已撤回的消息不可举报', async () => {
    ChatLog.findByPk.mockResolvedValue(buildMessage({ is_del: 1 }));
    await expect(reportService.createReport(2, 4, 501, '诈骗', [])).rejects.toThrow('消息不存在或已销毁');

    ChatLog.findByPk.mockResolvedValue(buildMessage({ is_revoked: 1 }));
    await expect(reportService.createReport(2, 4, 501, '诈骗', [])).rejects.toThrow('消息已撤回，无法举报');

    ChatLog.findByPk.mockResolvedValue(buildMessage({ destroy_at: Math.floor(Date.now() / 1000) - 5 }));
    await expect(reportService.createReport(2, 4, 501, '诈骗', [])).rejects.toThrow('消息已销毁，无法举报');
  });

  it('消息不存在时报错', async () => {
    ChatLog.findByPk.mockResolvedValue(null);
    await expect(reportService.createReport(2, 4, 501, '诈骗', [])).rejects.toThrow('消息不存在或已销毁');
  });
});
