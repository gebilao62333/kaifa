const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '多客陪玩商业版 API',
      version: '3.0.0',
      description: '多客陪玩商业版后端API接口文档',
      contact: {
        name: '开发团队',
        email: 'dev@duoke.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.duoke.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            mobile: { type: 'string' },
            avatar: { type: 'string' },
            nickname: { type: 'string' },
            gender: { type: 'integer' },
            status: { type: 'integer' },
            create_time: { type: 'string', format: 'date-time' }
          }
        },
        Response: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'integer' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            timestamp: { type: 'integer' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;