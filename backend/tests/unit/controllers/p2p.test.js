jest.mock('../../../src/socket', () => ({
  isUserOnline: jest.fn()
}));
jest.mock('../../../src/models', () => ({
  ChatLog: { findOne: jest.fn() },
  ChatSession: { findOne: jest.fn() }
}));

const { isUserOnline } = require('../../../src/socket');
const { ChatLog, ChatSession } = require('../../../src/models');
const p2pController = require('../../../src/controllers/p2pController');

const mockReq = (overrides = {}) => ({ body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - P2P', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 默认「无会话、无聊天记录」→ 与本人无社交关系
    ChatSession.findOne.mockResolvedValue(null);
    ChatLog.findOne.mockResolvedValue(null);
  });

  it('rejects invalid peerId', async () => {
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ userId: 1, query: { peerId: 'abc' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns online=true（已存在会话）', async () => {
    isUserOnline.mockResolvedValue(true);
    ChatSession.findOne.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ userId: 1, query: { peerId: '12' } }), res);
    expect(isUserOnline).toHaveBeenCalledWith(12);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { online: true } }));
  });

  it('returns online=false（已存在聊天记录）', async () => {
    isUserOnline.mockResolvedValue(false);
    ChatLog.findOne.mockResolvedValue({ id: 3 });
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ userId: 1, query: { peerId: '12' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { online: false } }));
  });

  it('允许探测本人在线状态（无需社交关系）', async () => {
    isUserOnline.mockResolvedValue(true);
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ userId: 12, query: { peerId: '12' } }), res);
    expect(ChatSession.findOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('M-11：与本人无社交关系 → 403，且不触达在线状态（阻断批量枚举）', async () => {
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ userId: 1, query: { peerId: '999' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(isUserOnline).not.toHaveBeenCalled();
  });

  it('maps error to 400', async () => {
    ChatSession.findOne.mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ userId: 1, query: { peerId: '12' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
