const { validate } = require('../../../src/middlewares/validation');

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
});
