const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eu搭子商业版 API',
      version: '3.0.0',
      description: 'eu搭子商业版后端API接口文档',
      contact: {
        name: '开发团队',
        email: 'dev@eudazi.com'
      }
    },
    // 审计 L3：服务器地址不再硬编码，当前环境取 SERVER_URL（config.baseUrl），
    // 生产文档地址可用 SWAGGER_PROD_URL 覆盖。
    servers: [
      {
        url: config.baseUrl,
        description: '当前环境'
      },
      {
        url: process.env.SWAGGER_PROD_URL || 'https://api.eudazi.com',
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
    path.resolve(__dirname, '../routes/*.js'),
    path.resolve(__dirname, '../controllers/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;