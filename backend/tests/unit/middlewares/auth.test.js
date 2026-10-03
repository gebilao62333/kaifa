jest.mock('../../../src/config/jwt', () => ({ verifyToken: jest.fn() }));
jest.mock('../../../src/models', () => ({ User: { findByPk: jest.fn() } }));
jest.mock('../../../src/config/redis', () => ({ getRedisClient: jest.fn() }));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    admin: { token: 'fixed-admin-token', emergencyLogin: false },
    paths: { logs: path.join(os.tmpdir(), 'dsh-auth-mw-logs') }
  };
});

const { authMiddleware, optionalAuth, adminAuth } = require('../../../src/middlewares/auth');
const { verifyToken } = require('../../../src/config/jwt');
const { User } = require('../../../src/models');
const { getRedisClient } = require('../../../src/config/redis');

const mockReq = (overrides = {}) => ({ headers: {}, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middleware - Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRedisClient.mockReturnValue(null);
  });

  describe('authMiddleware', () => {
    it('rejects requests without token', async () => {
      const res = mockRes();
      await authMiddleware(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects invalid token', async () => {
      verifyToken.mockReturnValue(null);
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer bad' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects blacklisted token', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      getRedisClient.mockReturnValue({ get: jest.fn().mockResolvedValue('1') });
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('allows token when redis is unavailable', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockResolvedValue({ id: 1, status: 1 });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await authMiddleware(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe(1);
      expect(req.token).toBe('t');
    });

    it('rejects when user does not exist', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockResolvedValue(null);
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects disabled or muted users', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockResolvedValue({ id: 1, status: 0 });
      const disabled = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), disabled, jest.fn());
      expect(disabled.status).toHaveBeenCalledWith(403);

      User.findByPk.mockResolvedValue({ id: 1, status: 1, jinyan_time: Math.floor(Date.now() / 1000) + 9999 });
      const muted = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), muted, jest.fn());
      expect(muted.status).toHaveBeenCalledWith(403);
    });

    it('returns 500 on unexpected error', async () => {
      verifyToken.mockReturnValue({ userId: 1 });
      User.findByPk.mockRejectedValue(new Error('db'));
      const res = mockRes();
      await authMiddleware(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('optionalAuth', () => {
    it('calls next without token', async () => {
      const next = jest.fn();
      await optionalAuth(mockReq(), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next when token invalid', async () => {
      verifyToken.mockReturnValue(null);
      const next = jest.fn();
      await optionalAuth(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('attaches user when found', async () => {
      verifyToken.mockReturnValue({ userId: 5 });
      User.findByPk.mockResolvedValue({ id: 5 });
      const next = jest.fn();
      const req = mockReq({ headers: { authorization: 'Bearer t' } });
      await optionalAuth(req, mockRes(), next);
      expect(req.userId).toBe(5);
      expect(next).toHaveBeenCalled();
    });

    it('calls next when user missing', async () => {
      verifyToken.mockReturnValue({ userId: 5 });
      User.findByPk.mockResolvedValue(null);
      const next = jest.fn();
      await optionalAuth(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('swallows errors and calls next', async () => {
      verifyToken.mockReturnValue({ userId: 5 });
      User.findByPk.mockRejectedValue(new Error('db'));
      const next = jest.fn();
      await optionalAuth(mockReq({ headers: { authorization: 'Bearer t' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('adminAuth', () => {
    it('rejects when no token candidates', () => {
      const res = mockRes();
      adminAuth(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('accepts the fixed emergency admin token', () => {
      const next = jest.fn();
      const req = mockReq({ headers: { 'x-admin-token': 'fixed-admin-token' } });
      adminAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.admin.permissions).toEqual(['all']);
    });

    it('accepts a verified admin JWT', () => {
      verifyToken.mockReturnValue({ id: 1, role: 'admin' });
      const next = jest.fn();
      adminAuth(mockReq({ headers: { authorization: 'Bearer admin-token' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('accepts a role_id=1 JWT', () => {
      verifyToken.mockReturnValue({ id: 2, role_id: 1 });
      const next = jest.fn();
      adminAuth(mockReq({ headers: { authorization: 'Bearer admin-token' } }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects non-admin JWT', () => {
      verifyToken.mockReturnValue({ id: 3, role: 'user' });
      const res = mockRes();
      adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('rejects when verifyToken throws', () => {
      verifyToken.mockImplementation(() => { throw new Error('bad'); });
      const res = mockRes();
      adminAuth(mockReq({ headers: { authorization: 'Bearer t' } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
