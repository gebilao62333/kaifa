const { validate, validateQuery, LIMITS } = require('../../../src/middlewares/validation');

describe('Middleware - Validation', () => {
  describe('validate middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should call next when validation passes', () => {
      req.body = { username: 'testuser', email: 'test@example.com' };
      
      const schema = {
        required: ['username'],
        fields: {
          username: { type: 'string', minLength: 3 },
          email: { type: 'string', minLength: 5 }
        }
      };

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when required field is missing', () => {
      const schema = {
        required: ['username']
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate string type', () => {
      req.body = { username: 123 };
      
      const schema = {
        fields: {
          username: { type: 'string' }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate number type', () => {
      req.body = { age: 'twenty' };
      
      const schema = {
        fields: {
          age: { type: 'number' }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate minLength', () => {
      req.body = { username: 'ab' };
      
      const schema = {
        fields: {
          username: { type: 'string', minLength: 3 }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate maxLength', () => {
      req.body = { username: 'verylongusernamethatexceedsmaxlength' };
      
      const schema = {
        fields: {
          username: { type: 'string', maxLength: 10 }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate min value', () => {
      req.body = { age: 17 };
      
      const schema = {
        fields: {
          age: { type: 'number', min: 18 }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate max value', () => {
      req.body = { age: 150 };
      
      const schema = {
        fields: {
          age: { type: 'number', max: 120 }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate regex pattern', () => {
      req.body = { email: 'invalid-email' };
      
      const schema = {
        fields: {
          email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should pass when all validations are satisfied', () => {
      req.body = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25
      };
      
      const schema = {
        required: ['username', 'email'],
        fields: {
          username: { type: 'string', minLength: 3, maxLength: 20 },
          email: { type: 'string', minLength: 5 },
          age: { type: 'number', min: 18, max: 100 }
        }
      };

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should collect multiple validation errors', () => {
      req.body = {
        username: 'ab',
        email: 'invalid',
        age: 'notanumber'
      };
      
      const schema = {
        required: ['username', 'email', 'age'],
        fields: {
          username: { type: 'string', minLength: 3 },
          email: { type: 'string', minLength: 5 },
          age: { type: 'number' }
        }
      };

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should allow optional fields to be missing', () => {
      req.body = { username: 'testuser' };
      
      const schema = {
        required: ['username'],
        fields: {
          username: { type: 'string', minLength: 3 },
          optionalField: { type: 'string' }
        }
      };

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // 审计 M-6：validation.js 此前全项目零挂载，写接口只靠 controller 里零散的 if(!x)+parseFloat，
  // 负数/超大数/「类型绕过」（parseFloat([100])===100 等）无统一防护。以下用例固化这次加固的边界。
  describe('validate middleware - M-6 hardening', () => {
    let req, res, next;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('rejects an array passed as a numeric field (parseFloat([100]) bypass)', () => {
      req.body = { amount: [100] };

      validate({ fields: { amount: { type: 'number', min: 0 } } })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects an object passed as a numeric field', () => {
      req.body = { amount: { value: 100 } };

      validate({ fields: { amount: { type: 'number' } } })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects a boolean passed as a numeric field (Number(true) === 1)', () => {
      req.body = { amount: true };

      validate({ fields: { amount: { type: 'number' } } })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects an array passed as a string field', () => {
      req.body = { account: ['x@alipay.com'] };

      validate({ fields: { account: { type: 'string', maxLength: 255 } } })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('coerces numeric strings and writes the number back to req.body', () => {
      req.body = { amount: '100.5', type: '2' };

      const schema = {
        fields: {
          amount: { type: 'number', min: 0.01, max: 100000000 },
          type: { type: 'integer', enum: [1, 2, 3] }
        }
      };

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.amount).toBe(100.5);
      expect(typeof req.body.amount).toBe('number');
      expect(req.body.type).toBe(2);
      expect(typeof req.body.type).toBe('number');
    });

    it('rejects numeric-looking strings that are not plain decimals', () => {
      for (const bad of ['1e5', '0x10', '1,000', 'abc', 'Infinity', 'NaN', '12px']) {
        req.body = { amount: bad };
        validate({ fields: { amount: { type: 'number' } } })(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('accepts a trimmed numeric string', () => {
      req.body = { amount: ' 12 ' };

      validate({ fields: { amount: { type: 'number' } } })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.amount).toBe(12);
    });

    it('rejects negative and oversized amounts against min/max', () => {
      req.body = { amount: -5 };
      validate({ fields: { amount: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX } } })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);

      jest.clearAllMocks();
      req.body = { amount: LIMITS.MONEY_MAX + 1 };
      validate({ fields: { amount: { type: 'number', min: 0.01, max: LIMITS.MONEY_MAX } } })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects a non-integer for an integer field', () => {
      req.body = { packageId: 1.5 };

      validate({ fields: { packageId: { type: 'integer', min: 1 } } })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('enforces enum whitelist', () => {
      req.body = { type: 4 };
      validate({ fields: { type: { type: 'integer', enum: [1, 2, 3] } } })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);

      jest.clearAllMocks();
      req.body = { type: 3 };
      validate({ fields: { type: { type: 'integer', enum: [1, 2, 3] } } })(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows enum value 0 (redpacket type = 0)', () => {
      req.body = { type: 0 };

      validate({ required: ['type'], fields: { type: { type: 'integer', enum: [0, 1] } } })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.type).toBe(0);
    });

    it('treats 0 as a present (non-blank) required value', () => {
      req.body = { amount: 0 };

      validate({ required: ['amount'], fields: { amount: { type: 'number' } } })(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('normalizes a missing/array body into an object before required checks', () => {
      req.body = undefined;

      validate({ required: ['amount'] })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('exports LIMITS with MONEY_MAX and ID_MAX', () => {
      expect(LIMITS.MONEY_MAX).toBe(100000000);
      expect(LIMITS.ID_MAX).toBe(2147483647);
    });
  });

  describe('validateQuery middleware - M-6 hardening', () => {
    let req, res, next;

    beforeEach(() => {
      req = { query: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('coerces numeric query strings and writes the number back', () => {
      req.query = { page: '2', pageSize: '50' };

      const schema = {
        fields: {
          page: { type: 'integer', min: 1 },
          pageSize: { type: 'integer', min: 1, max: 100 }
        }
      };

      validateQuery(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(2);
      expect(req.query.pageSize).toBe(50);
    });

    it('rejects non-numeric, non-plain-decimal and array query values', () => {
      for (const bad of ['abc', '1e5', 'Infinity', ['1', '2']]) {
        req.query = { page: bad };
        validateQuery({ fields: { page: { type: 'integer' } } })(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('applies min/max on the coerced value', () => {
      req.query = { pageSize: '0' };
      validateQuery({ fields: { pageSize: { type: 'integer', min: 1 } } })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);

      jest.clearAllMocks();
      req.query = { pageSize: '999999' };
      validateQuery({ fields: { pageSize: { type: 'integer', min: 1, max: 100 } } })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
