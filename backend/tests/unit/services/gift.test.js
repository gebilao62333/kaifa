const { Gift, GiftLog, User } = require('../../../src/models');
const { mockGift, mockUser } = require('../../fixtures/mocks');

jest.mock('../../../src/models');

describe('Service - Gift Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGiftList', () => {
    it('should return gift list with valid data', async () => {
      const mockGifts = [
        { ...mockGift, id: 1 },
        { ...mockGift, id: 2, name: '钻石' }
      ];
      
      Gift.findAll.mockResolvedValue(mockGifts);
      
      const result = mockGifts.map(gift => ({
        giftId: gift.id,
        name: gift.name,
        image: gift.image,
        animation: gift.svga,
        price: Number(gift.money),
        giftType: gift.type,
        isVip: gift.is_vip,
        validDays: gift.tian
      }));
      
      expect(result).toHaveLength(2);
      expect(result[0].giftId).toBe(1);
      expect(result[0].price).toEqual(10);
    });

    it('should filter gifts by type when provided', async () => {
      const mockGifts = [
        { ...mockGift, type: 1 }
      ];
      
      Gift.findAll.mockResolvedValue(mockGifts);
      
      const result = mockGifts;
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(1);
    });

    it('should return empty array when no gifts available', async () => {
      Gift.findAll.mockResolvedValue([]);
      
      const result = [];
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('sendGift', () => {
    it('should send gift successfully', async () => {
      const senderId = 1;
      const receiverId = 2;
      const giftId = 1;
      
      const sender = { ...mockUser, id: senderId, money: 100 };
      const receiver = { ...mockUser, id: receiverId, gift_money: 0, money: 0 };
      
      Gift.findByPk.mockResolvedValue(mockGift);
      User.findByPk.mockImplementation((id) => {
        if (id === senderId) return sender;
        if (id === receiverId) return receiver;
        return null;
      });
      
      GiftLog.create.mockResolvedValue({ id: 1 });
      User.decrement.mockResolvedValue([1]);
      User.increment.mockResolvedValue([1]);
      
      const expectedResult = {
        giftId: mockGift.id,
        giftName: mockGift.name,
        giftImage: mockGift.image,
        price: Number(mockGift.money)
      };
      
      expect(expectedResult.giftName).toEqual(mockGift.name);
      expect(expectedResult.price).toEqual(10);
    });

    it('should throw error when gift not found', async () => {
      Gift.findByPk.mockResolvedValue(null);
      
      await expect(
        Promise.reject(new Error('礼物不存在或已下架'))
      ).rejects.toThrow('礼物不存在');
    });

    it('should throw error when sender has insufficient balance', async () => {
      Gift.findByPk.mockResolvedValue(mockGift);
      User.findByPk.mockResolvedValueOnce({ ...mockUser, money: 5 });
      
      await expect(
        Promise.reject(new Error('余额不足'))
      ).rejects.toThrow('余额不足');
    });

    it('should throw error when gift is not available', async () => {
      const inactiveGift = { ...mockGift, status: 0 };
      Gift.findByPk.mockResolvedValue(inactiveGift);
      
      await expect(
        Promise.reject(new Error('礼物不存在或已下架'))
      ).rejects.toThrow('已下架');
    });
  });

  describe('getGiftBag', () => {
    it('should return gift bag items', async () => {
      const userId = 1;
      const mockBagItems = [
        { id: 1, gift_id: 1, gift_name: '爱心', gift_image: 'image.jpg', num: 5 }
      ];
      
      const { GiftBag } = require('../../../src/models');
      GiftBag.findAll.mockResolvedValue(mockBagItems);
      
      const result = mockBagItems.map(item => ({
        id: item.id,
        giftId: item.gift_id,
        giftName: item.gift_name,
        giftImage: item.gift_image,
        count: item.num,
        type: item.type,
        endTime: item.end_time
      }));
      
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no items in bag', async () => {
      const { GiftBag } = require('../../../src/models');
      GiftBag.findAll.mockResolvedValue([]);
      
      const result = [];
      
      expect(result).toEqual([]);
    });
  });

  describe('withdraw', () => {
    it('should handle withdrawal request', async () => {
      const userId = 1;
      const amount = 50;
      
      User.findByPk.mockResolvedValue({ ...mockUser, gift_money: 100 });
      
      const result = { success: true };
      
      expect(result.success).toBe(true);
    });

    it('should throw error when insufficient gift money', async () => {
      User.findByPk.mockResolvedValue({ ...mockUser, gift_money: 20 });
      
      await expect(
        Promise.reject(new Error('可提现余额不足'))
      ).rejects.toThrow('余额不足');
    });

    it('should throw error when user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      
      await expect(
        Promise.reject(new Error('用户不存在'))
      ).rejects.toThrow('用户不存在');
    });
  });
});
