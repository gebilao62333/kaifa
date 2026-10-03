const p2pController = require('../../../src/controllers/p2pController');

jest.mock('../../../src/socket', () => ({
  isUserOnline: jest.fn()
}));

const { isUserOnline } = require('../../../src/socket');

const mockReq = (overrides = {}) => ({ body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - P2P', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid peerId', async () => {
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ query: { peerId: 'abc' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns online=true', async () => {
    isUserOnline.mockResolvedValue(true);
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ query: { peerId: '12' } }), res);
    expect(isUserOnline).toHaveBeenCalledWith(12);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { online: true } }));
  });

  it('returns online=false', async () => {
    isUserOnline.mockResolvedValue(false);
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ query: { peerId: '12' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { online: false } }));
  });

  it('maps error to 400', async () => {
    isUserOnline.mockRejectedValue(new Error('socket down'));
    const res = mockRes();
    await p2pController.peerOnline(mockReq({ query: { peerId: '12' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
