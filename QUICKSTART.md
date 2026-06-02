# 多客陪玩 — 快速启动指南

> 项目路径：`/home/devbox/project/kaifa/`

## 环境要求

| 软件 | 最低版本 |
|------|----------|
| Node.js | 18.x LTS |
| MySQL | 8.0+ |
| Redis | 6.x |
| MongoDB | 4.4+（可选） |

## 快速启动后端

```bash
cd /home/devbox/project/kaifa/backend

# 1. 安装依赖
npm install

# 2. 配置环境变量（从模板复制）
cp .env.example .env
# 编辑 .env 填入数据库连接等配置

# 3. 启动服务（开发模式 + Mock 数据库）
npm run dev

# 4. 启动服务（使用真实数据库）
USE_MOCK_DB=false npm run dev
```

后端默认运行在 http://localhost:3000
- 健康检查: http://localhost:3000/api/health
- API 测试: http://localhost:3000/api/test
- Swagger 文档: http://localhost:3000/api-docs

## 快速启动前端

```bash
cd /home/devbox/project/kaifa/frontend

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

前端默认运行在 http://localhost:8082

## Docker 部署

```bash
cd /home/devbox/project/kaifa
docker-compose up -d
```

## 项目结构

```
kaifa/
├── frontend/              # Vue 3 + Vite 前端
│   ├── src/
│   │   ├── views/         # 50+ 页面组件
│   │   ├── components/    # 公共组件
│   │   ├── services/      # API 服务层
│   │   ├── store/         # Pinia 状态管理
│   │   └── router/        # Vue Router
│   └── package.json
├── backend/               # Express.js 后端
│   ├── src/
│   │   ├── controllers/   # 控制器（20个模块）
│   │   ├── services/      # 服务层
│   │   ├── models/        # 数据模型（MySQL + MongoDB）
│   │   ├── routes/        # 路由定义
│   │   ├── middlewares/   # 中间件（认证/安全/限流）
│   │   ├── socket/        # WebSocket
│   │   └── config/        # 配置文件
│   ├── server.js          # 入口文件
│   └── package.json
├── docker-compose.yml     # Docker 编排
└── QUICKSTART.md          # 本文件
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [后端部署文档](file:///home/devbox/project/kaifa/backend/部署文档.md) | 生产环境部署指南（Nginx/PM2/安全加固） |
| [后端API接口文档](file:///home/devbox/project/kaifa/backend/后端API接口文档.md) | 全部 API 接口说明 |
| [数据库设计文档](file:///home/devbox/project/kaifa/backend/数据库设计文档.md) | MySQL/MongoDB 表结构 |
| [数据字典](file:///home/devbox/project/kaifa/backend/数据字典文档.md) | 字段定义与说明 |
| [后端开发文档](file:///home/devbox/project/kaifa/backend/开发文档.md) | 开发规范与架构 |
| [后端测试指南](file:///home/devbox/project/kaifa/backend/测试指南.md) | 后端测试框架与命令 |
| [前端技术文档](file:///home/devbox/project/kaifa/frontend/技术文档.md) | 前端架构/路由/组件说明 |
| [前端功能文档](file:///home/devbox/project/kaifa/frontend/功能文档.md) | 页面功能与模块说明 |
| [前端测试指南](file:///home/devbox/project/kaifa/frontend/tests/测试运行指南.md) | 前端测试框架与编写规范 |