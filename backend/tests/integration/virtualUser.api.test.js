const request = require('supertest');
const express = require('express');
const setupRoutes = require('../../src/routes');
const { authMiddleware } = require('../../src/middlewares');

jest.mock('../../src/middlewares', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 1;
    next();
  }
}));

jest.mock('../../src/services/virtualUserService', () => ({
  createVirtualUser: jest.fn().mockResolvedValue({ id: 1, username: 'test-virtual' }),
  getAllVirtualUsers: jest.fn().mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 }),
  getVirtualUserById: jest.fn().mockResolvedValue({ id: 1, username: 'test-virtual' }),
  updateVirtualUser: jest.fn().mockResolvedValue({ id: 1, username: 'updated-virtual' }),
  deleteVirtualUser: jest.fn().mockResolvedValue(true),
  toggleOnlineStatus: jest.fn().mockResolvedValue({ id: 1, isOnline: 1 }),
  generateResponse: jest.fn().mockResolvedValue({ response: 'Hello!', contextId: 'ctx-123' }),
  getChatHistory: jest.fn().mockResolvedValue([]),
  clearContext: jest.fn().mockResolvedValue(true)
}));

const virtualUserService = require('../../src/services/virtualUserService');

describe('Integration - Virtual User API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    setupRoutes(app);
  });

  describe('POST /api/virtual-user', () => {
    it('should create virtual user successfully', async () => {
      const response = await request(app)
        .post('/api/virtual-user')
        .send({
          username: 'test-virtual',
          nickname: '测试虚拟用户',
          role: 'assistant',
          dialogueStyle: 'friendly'
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(201);
      expect(response.body.data.username).toBe('test-virtual');
      expect(virtualUserService.createVirtualUser).toHaveBeenCalled();
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/virtual-user')
        .send({
          nickname: '测试虚拟用户'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(400);
    });

    it('should return 422 when username exists', async () => {
      virtualUserService.createVirtualUser.mockRejectedValue(new Error('用户名已存在'));

      const response = await request(app)
        .post('/api/virtual-user')
        .send({
          username: 'existing-user',
          nickname: '测试虚拟用户'
        });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe('用户名已存在');
    });
  });

  describe('GET /api/virtual-user', () => {
    it('should get virtual user list', async () => {
      const response = await request(app).get('/api/virtual-user');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(virtualUserService.getAllVirtualUsers).toHaveBeenCalled();
    });

    it('should get virtual user list with filters', async () => {
      await request(app).get('/api/virtual-user?status=1&role=assistant');

      expect(virtualUserService.getAllVirtualUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: '1', role: 'assistant' })
      );
    });
  });

  describe('GET /api/virtual-user/:id', () => {
    it('should get virtual user by id', async () => {
      const response = await request(app).get('/api/virtual-user/1');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(1);
      expect(virtualUserService.getVirtualUserById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when user not found', async () => {
      virtualUserService.getVirtualUserById.mockRejectedValue(new Error('虚拟用户不存在'));

      const response = await request(app).get('/api/virtual-user/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('虚拟用户不存在');
    });
  });

  describe('PUT /api/virtual-user/:id', () => {
    it('should update virtual user successfully', async () => {
      const response = await request(app)
        .put('/api/virtual-user/1')
        .send({ nickname: '新昵称' });

      expect(response.status).toBe(200);
      expect(response.body.data.username).toBe('updated-virtual');
      expect(virtualUserService.updateVirtualUser).toHaveBeenCalledWith(1, { nickname: '新昵称' });
    });

    it('should return 422 when update fails', async () => {
      virtualUserService.updateVirtualUser.mockRejectedValue(new Error('更新失败'));

      const response = await request(app)
        .put('/api/virtual-user/1')
        .send({ nickname: '新昵称' });

      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /api/virtual-user/:id', () => {
    it('should delete virtual user successfully', async () => {
      const response = await request(app).delete('/api/virtual-user/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('虚拟用户删除成功');
      expect(virtualUserService.deleteVirtualUser).toHaveBeenCalledWith(1);
    });

    it('should return 404 when user not found', async () => {
      virtualUserService.deleteVirtualUser.mockRejectedValue(new Error('虚拟用户不存在'));

      const response = await request(app).delete('/api/virtual-user/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/virtual-user/:id/status', () => {
    it('should toggle online status', async () => {
      const response = await request(app)
        .post('/api/virtual-user/1/status')
        .send({ isOnline: true });

      expect(response.status).toBe(200);
      expect(response.body.data.isOnline).toBe(1);
      expect(virtualUserService.toggleOnlineStatus).toHaveBeenCalledWith(1, true);
    });
  });

  describe('POST /api/virtual-user/:virtualUserId/chat', () => {
    it('should chat with virtual user', async () => {
      const response = await request(app)
        .post('/api/virtual-user/1/chat')
        .send({ message: 'Hello' });

      expect(response.status).toBe(200);
      expect(response.body.data.response).toBe('Hello!');
      expect(virtualUserService.generateResponse).toHaveBeenCalledWith(1, 1, 'Hello', undefined);
    });

    it('should return 400 when message is empty', async () => {
      const response = await request(app)
        .post('/api/virtual-user/1/chat')
        .send({ message: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/virtual-user/:virtualUserId/history', () => {
    it('should get chat history', async () => {
      const response = await request(app).get('/api/virtual-user/1/history');

      expect(response.status).toBe(200);
      expect(virtualUserService.getChatHistory).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/virtual-user/:virtualUserId/context', () => {
    it('should clear context', async () => {
      const response = await request(app).delete('/api/virtual-user/1/context');

      expect(response.status).toBe(200);
      expect(virtualUserService.clearContext).toHaveBeenCalled();
    });
  });
});
