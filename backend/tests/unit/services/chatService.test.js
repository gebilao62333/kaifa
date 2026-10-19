/**
 * chatService 撤回链路单测（2026-10-17）
 * 覆盖：撤回抹掉原文、媒体地址清空与媒资登记清理、礼物/红包拦截、2 分钟窗口、
 *      历史消息接口对已撤回消息不下发原文。
 */
jest.mock('../../../src/models', () => ({
  ChatLog: { findAndCountAll: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), update: jest.fn(), create: jest.fn() },
  User: { findByPk: jest.fn() },
  VirtualUser: { findByPk: jest.fn() },
  ChatSession: { findAndCountAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  UserPref: { findOne: jest.fn() }
}));
jest.mock('../../../src/utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('../../../src/services', () => ({ mediaAssetService: { removeByBiz: jest.fn() } }));

const chatService = require('../../../src/services/chatService');
const { ChatLog, User, VirtualUser, UserPref, ChatSession } = require('../../../src/models');
const { mediaAssetService } = require('../../../src/services');

const nowSec = () => Math.floor(Date.now() / 1000);

const buildMessage = (over = {}) => ({
  id: 9,
  fromid: 100001,
  toid: 2,
  content: '原文内容',
  type: 0,
  vod_url: '',
  time: nowSec(),
  update: jest.fn().mockResolvedValue(true),
  ...over
});

const buildRow = (over = {}) => ({
  id: 1,
  fromid: 100001,
  toid: 2,
  content: '原文内容',
  type: 0,
  vod_url: '',
  sec: 0,
  time: 1700000000,
  isread: 1,
  is_revoked: 0,
  ...over
});

describe('Service - chatService.revokeMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('撤回后清空原文并置 is_revoked', async () => {
    const message = buildMessage();
    ChatLog.findByPk.mockResolvedValue(message);

    await expect(chatService.revokeMessage(100001, 9)).resolves.toBe(true);
    expect(message.update).toHaveBeenCalledWith({ is_revoked: 1, content: '' });
    expect(mediaAssetService.removeByBiz).not.toHaveBeenCalled();
  });

  it('媒体消息撤回时同时清空 vod_url 并清理媒资', async () => {
    const message = buildMessage({ type: 2, vod_url: 'https://cdn.example.com/a.jpg' });
    ChatLog.findByPk.mockResolvedValue(message);

    await chatService.revokeMessage(100001, 9);

    expect(message.update).toHaveBeenCalledWith({ is_revoked: 1, content: '', vod_url: null });
    expect(mediaAssetService.removeByBiz).toHaveBeenCalledWith('chat', 9);
  });

  it('媒资清理失败不影响撤回结果', async () => {
    const message = buildMessage({ type: 5, vod_url: 'https://cdn.example.com/a.mp3' });
    ChatLog.findByPk.mockResolvedValue(message);
    mediaAssetService.removeByBiz.mockRejectedValue(new Error('cos down'));

    await expect(chatService.revokeMessage(100001, 9)).resolves.toBe(true);
    expect(message.update).toHaveBeenCalledWith({ is_revoked: 1, content: '', vod_url: null });
  });

  it.each([6, 7])('type=%i 的礼物/红包消息不可撤回', async (type) => {
    const message = buildMessage({ type });
    ChatLog.findByPk.mockResolvedValue(message);

    await expect(chatService.revokeMessage(100001, 9)).rejects.toThrow('礼物/红包消息不可撤回');
    expect(message.update).not.toHaveBeenCalled();
  });

  it('视频消息（type=3）允许撤回', async () => {
    const message = buildMessage({ type: 3, vod_url: 'https://cdn.example.com/a.mp4' });
    ChatLog.findByPk.mockResolvedValue(message);

    await expect(chatService.revokeMessage(100001, 9)).resolves.toBe(true);
    expect(message.update).toHaveBeenCalledWith({ is_revoked: 1, content: '', vod_url: null });
  });

  it('超过 2 分钟不可撤回', async () => {
    const message = buildMessage({ time: nowSec() - 121 });
    ChatLog.findByPk.mockResolvedValue(message);

    await expect(chatService.revokeMessage(100001, 9)).rejects.toThrow('消息超过2分钟，无法撤回');
    expect(message.update).not.toHaveBeenCalled();
  });

  it('恰好 2 分钟边界仍可撤回', async () => {
    const message = buildMessage({ time: nowSec() - 120 });
    ChatLog.findByPk.mockResolvedValue(message);

    await expect(chatService.revokeMessage(100001, 9)).resolves.toBe(true);
  });

  it('不能撤回别人的消息', async () => {
    const message = buildMessage({ fromid: 200002 });
    ChatLog.findByPk.mockResolvedValue(message);

    await expect(chatService.revokeMessage(100001, 9)).rejects.toThrow('只能撤回自己发送的消息');
    expect(message.update).not.toHaveBeenCalled();
  });

  it('消息不存在时报错', async () => {
    ChatLog.findByPk.mockResolvedValue(null);

    await expect(chatService.revokeMessage(100001, 9)).rejects.toThrow('消息不存在');
  });
});

describe('Service - chatService.getChatMessages 撤回态', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findByPk.mockImplementation(async (id) => ({ id, avatar: 'avatar-' + id }));
    VirtualUser.findByPk.mockResolvedValue(null);
  });

  it('已撤回消息不下发原文与媒体地址，isRevoked 为 true', async () => {
    ChatLog.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        buildRow({ id: 1, is_revoked: 1, content: '机密原文', type: 2, vod_url: 'https://cdn.example.com/secret.jpg' }),
        buildRow({ id: 2, is_revoked: 0, content: '正常消息' })
      ]
    });

    const result = await chatService.getChatMessages(100001, 2, 1, 20);

    const revoked = result.list.find((m) => m.id === 1);
    expect(revoked.isRevoked).toBe(true);
    expect(revoked.content).toBe('');
    expect(revoked.mediaUrl).toBeNull();

    const normal = result.list.find((m) => m.id === 2);
    expect(normal.isRevoked).toBe(false);
    expect(normal.content).toBe('正常消息');
  });

  it('查询条件仍然按双方会话取数', async () => {
    ChatLog.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await chatService.getChatMessages(100001, 2, 1, 20);

    expect(result).toEqual({ total: 0, list: [] });
    const arg = ChatLog.findAndCountAll.mock.calls[0][0];
    expect(arg.where.is_del).toBe(0);
    expect(arg.offset).toBe(0);
    expect(arg.limit).toBe(20);
  });
});

describe('Service - chatService 时间自动撤回（expire_at）', () => {
  const nowSec = () => Math.floor(Date.now() / 1000);

  beforeEach(() => {
    jest.clearAllMocks();
    User.findByPk.mockResolvedValue({ id: 100001, status: 1 });
    VirtualUser.findByPk.mockResolvedValue({ id: 2, name: '陪玩师' });
    ChatLog.create.mockImplementation(async (payload) => ({ id: 77, time: payload.time, ...payload }));
    ChatSession.findOne.mockResolvedValue({ update: jest.fn() });
    UserPref.findOne.mockResolvedValue(null);
  });

  const sendOnce = () => chatService.sendMessage(100001, 2, 'hi', 0);

  it('用户开启自动撤回时，消息写入 expire_at 并在返回值带回 expireAt', async () => {
    UserPref.findOne.mockResolvedValue({ data: JSON.stringify({ privacy: { autoRecall: 60 } }) });

    const result = await sendOnce();

    const payload = ChatLog.create.mock.calls[0][0];
    expect(payload.expire_at).toBe(payload.time + 60);
    expect(result.expireAt).toBe(payload.expire_at);
  });

  it('未开启自动撤回时 expire_at 为 0', async () => {
    UserPref.findOne.mockResolvedValue({ data: JSON.stringify({ privacy: { autoRecall: 0 } }) });

    const result = await sendOnce();

    expect(ChatLog.create.mock.calls[0][0].expire_at).toBe(0);
    expect(result.expireAt).toBe(0);
  });

  it('偏好读取失败时退回不自动撤回，不影响发消息', async () => {
    UserPref.findOne.mockRejectedValue(new Error('pref db down'));

    const result = await sendOnce();

    expect(ChatLog.create.mock.calls[0][0].expire_at).toBe(0);
    expect(result.expireAt).toBe(0);
  });

  it('超过上限（5 分钟）按 300 秒截断', async () => {
    UserPref.findOne.mockResolvedValue({ data: JSON.stringify({ privacy: { autoRecall: 9999 } }) });

    await sendOnce();

    const payload = ChatLog.create.mock.calls[0][0];
    expect(payload.expire_at - payload.time).toBe(300);
  });

  it('历史消息：到期但清理器未扫到，也按已撤回下发且不下发原文', async () => {
    const now = nowSec();
    ChatLog.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{
        id: 3, fromid: 100001, toid: 2, content: '到期原文', type: 0, vod_url: '',
        sec: 0, time: now - 120, isread: 0, is_revoked: 0, expire_at: now - 1
      }]
    });
    User.findByPk.mockImplementation(async (id) => ({ id, avatar: 'a' }));
    VirtualUser.findByPk.mockResolvedValue(null);

    const result = await chatService.getChatMessages(100001, 2, 1, 20);
    const msg = result.list[0];

    expect(msg.isRevoked).toBe(true);
    expect(msg.content).toBe('');
    expect(msg.expireAt).toBe(0);
  });

  it('历史消息：未到期时下发 expireAt 供客户端倒计时', async () => {
    const now = nowSec();
    ChatLog.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{
        id: 4, fromid: 100001, toid: 2, content: '还没到期', type: 0, vod_url: '',
        sec: 0, time: now, isread: 0, is_revoked: 0, expire_at: now + 60
      }]
    });
    User.findByPk.mockImplementation(async (id) => ({ id, avatar: 'a' }));
    VirtualUser.findByPk.mockResolvedValue(null);

    const result = await chatService.getChatMessages(100001, 2, 1, 20);
    const msg = result.list[0];

    expect(msg.isRevoked).toBe(false);
    expect(msg.content).toBe('还没到期');
    expect(msg.expireAt).toBe(now + 60);
  });
});

describe('Service - chatService.sweepExpiredMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('把到期消息落库为已撤回，媒体消息同时清 vod_url 并清理媒资', async () => {
    const text = { id: 1, type: 0, vod_url: '', update: jest.fn().mockResolvedValue(true) };
    const image = { id: 2, type: 2, vod_url: 'https://cdn.example.com/a.jpg', update: jest.fn().mockResolvedValue(true) };
    ChatLog.findAll.mockResolvedValue([text, image]);

    const affected = await chatService.sweepExpiredMessages();

    expect(affected).toBe(2);
    expect(text.update).toHaveBeenCalledWith({ is_revoked: 1, content: '' });
    expect(image.update).toHaveBeenCalledWith({ is_revoked: 1, content: '', vod_url: null });
    expect(mediaAssetService.removeByBiz).toHaveBeenCalledWith('chat', 2);
  });

  it('查询失败返回 0 且不抛出', async () => {
    ChatLog.findAll.mockRejectedValue(new Error('db down'));

    await expect(chatService.sweepExpiredMessages()).resolves.toBe(0);
  });

  it('单条更新失败不影响其余消息', async () => {
    const bad = { id: 1, type: 0, vod_url: '', update: jest.fn().mockRejectedValue(new Error('lock')) };
    const good = { id: 2, type: 0, vod_url: '', update: jest.fn().mockResolvedValue(true) };
    ChatLog.findAll.mockResolvedValue([bad, good]);

    await expect(chatService.sweepExpiredMessages()).resolves.toBe(1);
  });
});

describe('Service - chatService 已读自动销毁', () => {
  const nowSec = () => Math.floor(Date.now() / 1000);

  beforeEach(() => {
    jest.clearAllMocks();
    ChatLog.update.mockResolvedValue([1]);
    ChatSession.update.mockResolvedValue([1]);
    UserPref.findOne.mockResolvedValue(null);
  });

  it('发送方开启自动销毁时，标记已读写入 read_at 与 destroy_at，并返回 destroyAt', async () => {
    UserPref.findOne.mockResolvedValue({ data: JSON.stringify({ privacy: { autoDestroy: 60 } }) });

    const result = await chatService.markAsRead(2, 100001);

    const fields = ChatLog.update.mock.calls[0][0];
    expect(typeof fields.read_at).toBe('number');
    expect(fields.destroy_at).toBe(fields.read_at + 60);
    expect(result.destroyAt).toBe(fields.destroy_at);
    expect(ChatLog.update.mock.calls[0][1].where).toEqual({ fromid: 100001, toid: 2, isread: 0 });
  });

  it('发送方未开启时只写 isread/read_at，destroyAt 为 0', async () => {
    const result = await chatService.markAsRead(2, 100001);

    const fields = ChatLog.update.mock.calls[0][0];
    expect(fields.isread).toBe(1);
    expect(typeof fields.read_at).toBe('number');
    expect(fields.destroy_at).toBeUndefined();
    expect(result.destroyAt).toBe(0);
  });

  it('偏好读取失败时退化为不销毁，仍完成已读标记', async () => {
    UserPref.findOne.mockRejectedValue(new Error('pref down'));

    const result = await chatService.markAsRead(2, 100001);

    expect(ChatLog.update).toHaveBeenCalled();
    expect(result.destroyAt).toBe(0);
  });

  it('自动销毁期限超过上限（60 秒）按上限截断', async () => {
    UserPref.findOne.mockResolvedValue({ data: JSON.stringify({ privacy: { autoDestroy: 9999 } }) });
    const before = nowSec();

    const result = await chatService.markAsRead(2, 100001);

    expect(result.destroyAt - before).toBeLessThanOrEqual(61);
    expect(result.destroyAt - before).toBeGreaterThanOrEqual(60);
  });

  it('历史消息映射：未到期的 destroyAt 下发，已过期的置 0（读接口由 SQL 过滤兜底）', async () => {
    const now = nowSec();
    ChatLog.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { id: 11, fromid: 100001, toid: 2, content: '未到期', type: 0, vod_url: '', sec: 0, time: now, isread: 1, is_revoked: 0, expire_at: 0, read_at: now, destroy_at: now + 30 },
        { id: 12, fromid: 100001, toid: 2, content: '已过期', type: 0, vod_url: '', sec: 0, time: now, isread: 1, is_revoked: 0, expire_at: 0, read_at: now - 60, destroy_at: now - 1 }
      ]
    });
    User.findByPk.mockImplementation(async (id) => ({ id, avatar: 'a' }));
    VirtualUser.findByPk.mockResolvedValue(null);

    const result = await chatService.getChatMessages(2, 100001, 1, 20);

    const pending = result.list.find((m) => m.id === 11);
    const overdue = result.list.find((m) => m.id === 12);
    expect(pending.destroyAt).toBe(now + 30);
    expect(pending.readAt).toBe(now);
    expect(overdue.destroyAt).toBe(0);

    // 查询条件里必须带「未销毁」过滤，否则过期消息会在读接口漏出（Op 是 Symbol，需用 inspect 看）
    const { inspect } = require('util');
    const where = ChatLog.findAndCountAll.mock.calls[0][0].where;
    const dump = inspect(where, { depth: 8 });
    expect(dump).toContain('destroy_at');
    expect(dump).toContain('Symbol(or)');
  });
});

describe('Service - chatService.sweepDestroyedMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('到期消息清空内容、置 is_del=1，并把会话列表最后一条换成占位', async () => {
    const text = { id: 21, type: 0, vod_url: '', fromid: 100001, toid: 2, time: 1700000000, update: jest.fn().mockResolvedValue(true) };
    const image = { id: 22, type: 2, vod_url: 'https://cdn.example.com/a.jpg', fromid: 100001, toid: 2, time: 1700000001, update: jest.fn().mockResolvedValue(true) };
    ChatLog.findAll.mockResolvedValue([text, image]);
    ChatSession.update.mockResolvedValue([1]);

    const affected = await chatService.sweepDestroyedMessages();

    expect(affected).toBe(2);
    expect(text.update).toHaveBeenCalledWith(expect.objectContaining({ is_del: 1, content: '' }));
    expect(text.update.mock.calls[0][0].destroyed_at).toBeGreaterThan(0);
    expect(image.update).toHaveBeenCalledWith(expect.objectContaining({ is_del: 1, content: '', vod_url: null }));
    expect(mediaAssetService.removeByBiz).toHaveBeenCalledWith('chat', 22);
    // 双方会话各更新一次
    expect(ChatSession.update).toHaveBeenCalledTimes(4);
    expect(ChatSession.update.mock.calls[0][0]).toEqual({ last_message: '[消息已销毁]' });
  });

  it('查询失败返回 0 且不抛出', async () => {
    ChatLog.findAll.mockRejectedValue(new Error('db down'));
    await expect(chatService.sweepDestroyedMessages()).resolves.toBe(0);
  });

  it('单条失败不影响其余消息，会话占位失败也不影响计数', async () => {
    const bad = { id: 31, type: 0, vod_url: '', fromid: 1, toid: 2, time: 1, update: jest.fn().mockRejectedValue(new Error('lock')) };
    const good = { id: 32, type: 0, vod_url: '', fromid: 1, toid: 2, time: 2, update: jest.fn().mockResolvedValue(true) };
    ChatLog.findAll.mockResolvedValue([bad, good]);
    ChatSession.update.mockRejectedValue(new Error('session down'));

    await expect(chatService.sweepDestroyedMessages()).resolves.toBe(1);
  });
});
