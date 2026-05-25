const helper = require('../../../src/utils/helper');
const { v4: uuidv4 } = require('uuid');

jest.mock('uuid', () => ({
  v4: jest.fn()
}));

describe('Utils - Helper Functions', () => {
  describe('generateOrderNo', () => {
    it('should generate order number with correct format', () => {
      const result = helper.generateOrderNo();
      expect(result).toMatch(/^DK\d+[A-Z0-9]+$/i);
      expect(result.length).toBeGreaterThan(10);
    });

    it('should generate unique order numbers', () => {
      const orderNo1 = helper.generateOrderNo();
      const orderNo2 = helper.generateOrderNo();
      expect(orderNo1).not.toEqual(orderNo2);
    });
  });

  describe('generatePacketNo', () => {
    it('should generate packet number with correct format', () => {
      const result = helper.generatePacketNo();
      expect(result).toMatch(/^PK\d+[A-Z0-9]+$/i);
    });

    it('should generate unique packet numbers', () => {
      const packetNo1 = helper.generatePacketNo();
      const packetNo2 = helper.generatePacketNo();
      expect(packetNo1).not.toEqual(packetNo2);
    });
  });

  describe('generateCallNo', () => {
    it('should generate call number with correct format', () => {
      const result = helper.generateCallNo();
      expect(result).toMatch(/^CL\d+[A-Z0-9]+$/i);
    });

    it('should generate unique call numbers', () => {
      const callNo1 = helper.generateCallNo();
      const callNo2 = helper.generateCallNo();
      expect(callNo1).not.toEqual(callNo2);
    });
  });

  describe('generateUUID', () => {
    it('should call uuidv4 and return the result', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      uuidv4.mockReturnValue(mockUUID);
      
      const result = helper.generateUUID();
      expect(uuidv4).toHaveBeenCalled();
      expect(result).toEqual(mockUUID);
    });
  });

  describe('generateShortId', () => {
    it('should generate short id with correct format', () => {
      const result = helper.generateShortId();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(5);
    });

    it('should generate unique short ids', () => {
      const id1 = helper.generateShortId();
      const id2 = helper.generateShortId();
      expect(id1).not.toEqual(id2);
    });
  });

  describe('formatTime', () => {
    it('should format timestamp to readable time', () => {
      const timestamp = 1715424000;
      const result = helper.formatTime(timestamp);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getTimestamp', () => {
    it('should return current timestamp in seconds', () => {
      const result = helper.getTimestamp();
      expect(typeof result).toBe('number');
      expect(Math.floor(Date.now() / 1000) - result).toBeLessThan(2);
    });
  });

  describe('getDateStr', () => {
    it('should return date string in YYYY-MM-DD format', () => {
      const timestamp = 1715424000;
      const result = helper.getDateStr(timestamp);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseQuery', () => {
    it('should return default pagination values when no query params', () => {
      const result = helper.parseQuery({});
      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        offset: 0,
        limit: 20
      });
    });

    it('should parse page and pageSize from query', () => {
      const result = helper.parseQuery({ page: 2, pageSize: 10 });
      expect(result).toEqual({
        page: 2,
        pageSize: 10,
        offset: 10,
        limit: 10
      });
    });

    it('should handle invalid page values', () => {
      const result = helper.parseQuery({ page: 'invalid' });
      expect(result.page).toBe(1);
    });
  });

  describe('formatPaginatedResponse', () => {
    it('should format paginated response correctly', () => {
      const data = [1, 2, 3];
      const total = 10;
      const page = 2;
      const pageSize = 5;

      const result = helper.formatPaginatedResponse(data, total, page, pageSize);

      expect(result).toEqual({
        total,
        page,
        pageSize,
        totalPages: 2,
        list: data
      });
    });

    it('should calculate totalPages correctly', () => {
      const result = helper.formatPaginatedResponse([], 11, 1, 5);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const startTime = Date.now();
      await helper.sleep(50);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    }, 200);
  });

  describe('retry', () => {
    it('should call function and return result on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await helper.retry(mockFn);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const mockFn = jest.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const result = await helper.retry(mockFn, 3, 10);
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('should throw error after max attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(helper.retry(mockFn, 2, 10)).rejects.toThrow('Failed');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
