const giftController = require('../../../src/controllers/gift');

jest.mock('../../../src/services', () => ({
  giftService: {
    getGiftList: jest.fn(),
    sendGift: jest.fn(),
    getGiftBag: jest.fn(),
    withdraw: jest.fn(),
    sendRedPacket: jest.fn(),
    receiveRedPacket: jest.fn(),
    getRedPacketHistory: jest.fn()
  }
}));

const { giftService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Gift', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getGiftList with type filter', async () => {
    giftService.getGiftList.mockResolvedValue([{ id: 1 }]);
    const res = mockRes();
    await giftController.getGiftList(mockReq({ query: { type: '1' } }), res);
    expect(giftService.getGiftList).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getGiftList without type passes null', async () => {
    giftService.getGiftList.mockResolvedValue([]);
    const res = mockRes();
    await giftController.getGiftList(mockReq({ query: {} }), res);
    expect(giftService.getGiftList).toHaveBeenCalledWith(null);
  });

  it('getGiftList returns 500 on error', async () => {
    giftService.getGiftList.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await giftController.getGiftList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('sendGift rejects missing fields', async () => {
    const res = mockRes();
    await giftController.sendGift(mockReq({ body: { receiverId: 2 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendGift succeeds with defaults', async () => {
    giftService.sendGift.mockResolvedValue({ ok: true });
    const res = mockRes();
    await giftController.sendGift(mockReq({ body: { receiverId: '2', giftId: '3' } }), res);
    expect(giftService.sendGift).toHaveBeenCalledWith(100001, 2, 3, 0, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sendGift passes room and count and maps error to 422', async () => {
    giftService.sendGift.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await giftController.sendGift(mockReq({ body: { receiverId: 2, giftId: 3, roomId: '7', count: '5' } }), res);
    expect(giftService.sendGift).toHaveBeenCalledWith(100001, 2, 3, 7, 5);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getGiftBag returns bag', async () => {
    giftService.getGiftBag.mockResolvedValue([]);
    const res = mockRes();
    await giftController.getGiftBag(mockReq(), res);
    expect(giftService.getGiftBag).toHaveBeenCalledWith(100001);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('withdraw rejects non-positive amount', async () => {
    const res = mockRes();
    await giftController.withdraw(mockReq({ body: { money: 0 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('withdraw succeeds with defaults', async () => {
    giftService.withdraw.mockResolvedValue({ ok: true });
    const res = mockRes();
    await giftController.withdraw(mockReq({ body: { money: '10.5' } }), res);
    expect(giftService.withdraw).toHaveBeenCalledWith(100001, 10.5, 1, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('withdraw maps error to 422', async () => {
    giftService.withdraw.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await giftController.withdraw(mockReq({ body: { money: 10, type: 2, bankInfo: { a: 1 } } }), res);
    expect(giftService.withdraw).toHaveBeenCalledWith(100001, 10, 2, { a: 1 });
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('sendRedPacket rejects missing fields', async () => {
    const res = mockRes();
    await giftController.sendRedPacket(mockReq({ body: { totalAmount: 10 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendRedPacket succeeds', async () => {
    giftService.sendRedPacket.mockResolvedValue({ packetNo: 'P1' });
    const res = mockRes();
    await giftController.sendRedPacket(mockReq({ body: { type: '1', totalAmount: '20', totalNum: '4', roomId: '9' } }), res);
    expect(giftService.sendRedPacket).toHaveBeenCalledWith(100001, 1, 20, 4, 9);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sendRedPacket maps error to 422', async () => {
    giftService.sendRedPacket.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await giftController.sendRedPacket(mockReq({ body: { totalAmount: 20, totalNum: 4 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('receiveRedPacket rejects missing packetNo', async () => {
    const res = mockRes();
    await giftController.receiveRedPacket(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('receiveRedPacket succeeds', async () => {
    giftService.receiveRedPacket.mockResolvedValue({ money: 5 });
    const res = mockRes();
    await giftController.receiveRedPacket(mockReq({ body: { packetNo: 'P1' } }), res);
    expect(giftService.receiveRedPacket).toHaveBeenCalledWith(100001, 'P1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('receiveRedPacket maps error to 422', async () => {
    giftService.receiveRedPacket.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await giftController.receiveRedPacket(mockReq({ body: { packetNo: 'P1' } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getRedPacketHistory uses default type', async () => {
    giftService.getRedPacketHistory.mockResolvedValue([]);
    const res = mockRes();
    await giftController.getRedPacketHistory(mockReq({ query: {} }), res);
    expect(giftService.getRedPacketHistory).toHaveBeenCalledWith(100001, 'all');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
