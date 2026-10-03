const chatController = require('../../../src/controllers/chat');

jest.mock('../../../src/services', () => ({
  chatService: {
    getChatList: jest.fn(),
    getChatMessages: jest.fn(),
    sendMessage: jest.fn(),
    revokeMessage: jest.fn(),
    markAsRead: jest.fn()
  }
}));

const { chatService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Chat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getChatList returns list', async () => {
    chatService.getChatList.mockResolvedValue([{ id: 1 }]);
    const req = mockReq({ query: { page: '2', pageSize: '5' } });
    const res = mockRes();

    await chatController.getChatList(req, res);

    expect(chatService.getChatList).toHaveBeenCalledWith(100001, 2, 5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getChatList returns 500 on error', async () => {
    chatService.getChatList.mockRejectedValue(new Error('boom'));
    const res = mockRes();
    await chatController.getChatList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getMessages rejects missing targetUserId', async () => {
    const res = mockRes();
    await chatController.getMessages(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getMessages returns messages', async () => {
    chatService.getChatMessages.mockResolvedValue([{ id: 1, content: 'hi' }]);
    const req = mockReq({ query: { targetUserId: '2', page: '1', pageSize: '20' } });
    const res = mockRes();

    await chatController.getMessages(req, res);

    expect(chatService.getChatMessages).toHaveBeenCalledWith(100001, 2, 1, 20);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getMessages returns 500 on error', async () => {
    chatService.getChatMessages.mockRejectedValue(new Error('boom'));
    const req = mockReq({ query: { targetUserId: '2' } });
    const res = mockRes();
    await chatController.getMessages(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('sendMessage rejects missing fields', async () => {
    const res = mockRes();
    await chatController.sendMessage(mockReq({ body: { targetUserId: 2 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendMessage sends with defaults', async () => {
    chatService.sendMessage.mockResolvedValue({ id: 1 });
    const req = mockReq({ body: { targetUserId: '2', content: 'hello' } });
    const res = mockRes();

    await chatController.sendMessage(req, res);

    expect(chatService.sendMessage).toHaveBeenCalledWith(100001, 2, 'hello', 0, undefined, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sendMessage passes media and duration and maps error to 422', async () => {
    chatService.sendMessage.mockRejectedValue(new Error('bad'));
    const req = mockReq({ body: { targetUserId: 2, content: 'x', type: '2', mediaUrl: 'a.mp3', duration: '10' } });
    const res = mockRes();

    await chatController.sendMessage(req, res);

    expect(chatService.sendMessage).toHaveBeenCalledWith(100001, 2, 'x', 2, 'a.mp3', 10);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('revokeMessage rejects missing id', async () => {
    const res = mockRes();
    await chatController.revokeMessage(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('revokeMessage succeeds', async () => {
    chatService.revokeMessage.mockResolvedValue(true);
    const res = mockRes();
    await chatController.revokeMessage(mockReq({ body: { messageId: '8' } }), res);
    expect(chatService.revokeMessage).toHaveBeenCalledWith(100001, 8);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('revokeMessage maps error to 422', async () => {
    chatService.revokeMessage.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await chatController.revokeMessage(mockReq({ body: { messageId: 8 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('markAsRead rejects missing targetUserId', async () => {
    const res = mockRes();
    await chatController.markAsRead(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('markAsRead succeeds', async () => {
    chatService.markAsRead.mockResolvedValue(true);
    const res = mockRes();
    await chatController.markAsRead(mockReq({ body: { targetUserId: '2' } }), res);
    expect(chatService.markAsRead).toHaveBeenCalledWith(100001, 2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('markAsRead returns 500 on error', async () => {
    chatService.markAsRead.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await chatController.markAsRead(mockReq({ body: { targetUserId: 2 } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
