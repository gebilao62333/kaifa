const response = require('../../../src/utils/response');

describe('Utils - Response Helper', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('success', () => {
    it('should return 200 success response', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Operation successful';
      
      response.success(mockRes, data, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 200,
        message,
        data
      });
    });

    it('should use default message if not provided', () => {
      response.success(mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 200,
        message: 'success',
        data: {}
      });
    });
  });

  describe('created', () => {
    it('should return 201 created response', () => {
      const data = { id: 1 };
      
      response.created(mockRes, data);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 201,
        message: '创建成功',
        data
      });
    });
  });

  describe('badRequest', () => {
    it('should return 400 bad request response', () => {
      const message = 'Invalid parameters';
      
      response.badRequest(mockRes, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 400,
        message
      });
    });
  });

  describe('unauthorized', () => {
    it('should return 401 unauthorized response', () => {
      response.unauthorized(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 401,
        message: '未授权'
      });
    });
  });

  describe('forbidden', () => {
    it('should return 403 forbidden response', () => {
      response.forbidden(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 403,
        message: '禁止访问'
      });
    });
  });

  describe('notFound', () => {
    it('should return 404 not found response', () => {
      const message = 'Resource not found';
      
      response.notFound(mockRes, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 404,
        message
      });
    });
  });

  describe('unprocessableEntity', () => {
    it('should return 422 unprocessable entity response', () => {
      const message = 'Business logic error';
      
      response.unprocessableEntity(mockRes, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 422,
        message
      });
    });
  });

  describe('error', () => {
    it('should return 500 internal server error response', () => {
      response.error(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 500,
        message: '服务器错误'
      });
    });
  });

  describe('custom', () => {
    it('should return custom response with specified code', () => {
      response.custom(mockRes, 418, "I'm a teapot", { tea: 'earl grey' });
      
      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 418,
        message: "I'm a teapot",
        data: { tea: 'earl grey' }
      });
    });
  });
});
