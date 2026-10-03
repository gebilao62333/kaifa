const currency = require('../../../src/utils/currency');

describe('Utils - Currency', () => {
  it('exposes constants', () => {
    expect(currency.CURRENCY_UNIT).toBe('金币');
    expect(currency.MIN_WITHDRAW_AMOUNT).toBe(100);
    expect(currency.WITHDRAW_FEE_RATE).toBe(0.05);
    expect(currency.EXCHANGE_RATE).toBe(10);
  });

  describe('validateGoldCoins', () => {
    it('rejects non-numeric amounts', () => {
      expect(currency.validateGoldCoins('abc').valid).toBe(false);
    });

    it('rejects non-positive amounts', () => {
      expect(currency.validateGoldCoins(0).valid).toBe(false);
      expect(currency.validateGoldCoins(-5).valid).toBe(false);
    });

    it('rejects amounts below the minimum', () => {
      const r = currency.validateGoldCoins(50);
      expect(r.valid).toBe(false);
      expect(r.message).toContain('100');
    });

    it('accepts valid amounts', () => {
      expect(currency.validateGoldCoins(100)).toEqual({ valid: true, message: '' });
    });
  });

  describe('formatCurrency', () => {
    it('formats numbers with and without unit', () => {
      expect(currency.formatCurrency(10)).toBe('10.00 金币');
      expect(currency.formatCurrency(10, false)).toBe('10.00');
    });

    it('handles null, undefined and NaN', () => {
      expect(currency.formatCurrency(null)).toBe('0.00 金币');
      expect(currency.formatCurrency(undefined, false)).toBe('0.00');
      expect(currency.formatCurrency('abc')).toBe('0.00 金币');
    });
  });

  describe('conversions', () => {
    it('converts fiat to coins', () => {
      expect(currency.convertToCoins(10)).toBe(100);
      expect(currency.convertToCoins(null)).toBe(0);
      expect(currency.convertToCoins('abc')).toBe(0);
    });

    it('converts coins to fiat', () => {
      expect(currency.convertToFiat(100)).toBe(10);
      expect(currency.convertToFiat(undefined)).toBe(0);
      expect(currency.convertToFiat('abc')).toBe(0);
    });
  });

  describe('withdraw calculations', () => {
    it('calculates fee and net amount', () => {
      expect(currency.calculateWithdrawFee(100)).toBe(5);
      expect(currency.calculateWithdrawFee(null)).toBe(0);
      expect(currency.calculateWithdrawFee('abc')).toBe(0);
      expect(currency.calculateNetWithdraw(100)).toBe(95);
    });
  });

  describe('normalizeAmount', () => {
    it('normalizes empty and invalid values to 0', () => {
      expect(currency.normalizeAmount(null)).toBe(0);
      expect(currency.normalizeAmount(undefined)).toBe(0);
      expect(currency.normalizeAmount('')).toBe(0);
      expect(currency.normalizeAmount('abc')).toBe(0);
      expect(currency.normalizeAmount('12.5')).toBe(12.5);
    });
  });

  describe('validateCurrencyUnit', () => {
    it('rejects empty or wrong units', () => {
      expect(currency.validateCurrencyUnit('').valid).toBe(false);
      expect(currency.validateCurrencyUnit('美元').valid).toBe(false);
    });

    it('accepts the correct unit', () => {
      expect(currency.validateCurrencyUnit('金币')).toEqual({ valid: true, message: '' });
    });
  });

  describe('createCurrencyMiddleware', () => {
    const run = (body) => {
      const req = { body };
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() })
      };
      const next = jest.fn();
      currency.createCurrencyMiddleware()(req, res, next);
      return { req, res, next };
    };

    it('rejects invalid currency', () => {
      const { res, next } = run({ currency: '美元' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('converts money to goldCoins', () => {
      const { req, next } = run({ money: 10 });
      expect(req.body.goldCoins).toBe(100);
      expect(next).toHaveBeenCalled();
    });

    it('keeps explicit goldCoins and accepts correct currency', () => {
      const { req, next } = run({ currency: '金币', money: 10, goldCoins: 7 });
      expect(req.body.goldCoins).toBe(7);
      expect(next).toHaveBeenCalled();
    });
  });
});
