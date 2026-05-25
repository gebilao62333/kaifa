const request = require('supertest');
const app = require('../fixtures/test-app');

describe('Integration - API Routes', () => {
  describe('Health Check', () => {
    it('should return 200 for health check endpoint', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('OK');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('User Routes - Mocked', () => {
    it('should get test user data', async () => {
      const response = await request(app).get('/api/user/test');
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.userId).toBe(1);
      expect(response.body.data.nickname).toBe('Test User');
    });

    it('should create test user', async () => {
      const response = await request(app)
        .post('/api/user/test')
        .send({ name: 'John Doe' });
      
      expect(response.status).toBe(201);
      expect(response.body.code).toBe(201);
      expect(response.body.message).toBe('创建成功');
      expect(response.body.data.name).toBe('John Doe');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app).get('/api/notfound');
      
      expect(response.status).toBe(404);
      expect(response.body.code).toBe(404);
    });

    it('should return 500 for server error', async () => {
      const response = await request(app).get('/api/error');
      
      expect(response.status).toBe(500);
      expect(response.body.code).toBe(500);
    });
  });

  describe('Request Validation', () => {
    it('should handle POST requests with valid JSON', async () => {
      const response = await request(app)
        .post('/api/user/test')
        .set('Content-Type', 'application/json')
        .send({ name: 'Jane Smith' });
      
      expect(response.status).toBe(201);
    });
  });

  describe('Response Format', () => {
    it('should always return consistent response structure', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    });
  });
});
