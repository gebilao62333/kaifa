# 多客陪玩 — 快速启动指南

> 项目路径：`/home/devbox/project/kaifa/`
> 版本：v3.0.0

## 环境要求

| 软件 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18.x LTS | 全部子项目运行环境 |
| MySQL | 8.0+ | 生产环境需要；开发可用 Mock 模式跳过 |
| Redis | 6.x | 生产环境需要；开发可用内存 Mock 模式 |
| MongoDB | 4.4+ | 可选；开发模式自动跳过 |

## 快速启动（开发模式，无需外部数据库）

开发模式下使用本地 JSON 文件模拟数据库，无需安装 MySQL/Redis/MongoDB。

### 1. 启动后端

```bash
cd /home/devbox/project/kaifa/backend

# 安装依赖
npm install

# 配置环境变量（从模板复制）
cp .env.example .env
# 默认 .env 已配置 USE_MOCK_DB=true，可直接启动

# 启动服务
npm run dev
```

后端默认运行在 http://localhost:3001
- 健康检查: http://localhost:3001/api/health
- API 测试: http://localhost:3001/api/test
- Swagger 文档: http://localhost:3001/api-docs

### 2. 启动用户前端

```bash
cd /home/devbox/project/kaifa/frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端默认运行在 http://localhost:8082

### 3. 启动管理后台

```bash
cd /home/devbox/project/kaifa/admin-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

管理后台默认运行在 http://localhost:8081
- 默认管理员账号: `admin` / `admin123`
- 开发模式自动注入 admin_token，无需手动登录

## 使用真实数据库启动

```bash
# 后端使用真实 MySQL/Redis/MongoDB
cd /home/devbox/project/kaifa/backend
USE_MOCK_DB=false npm run dev
```

## Docker 部署

```bash
cd /home/devbox/project/kaifa
docker-compose up -d
```

## 项目结构

```
kaifa/
├── frontend/              # Vue 3 + Vite 用户前端
│   ├── src/
│   │   ├── views/         # 57 个页面组件
│   │   ├── components/    # 公共组件
│   │   ├── services/      # API 服务层
│   │   ├── store/         # Pinia 状态管理
│   │   └── router/        # Vue Router
│   ├── tests/             # 前端测试
│   └── package.json
├── admin-frontend/        # Vue 3 + Vite 管理后台
│   ├── src/
│   │   ├── views/
│   │   │   └── admin/     # 25 个管理页面
│   │   ├── router/        # Vue Router + 路由守卫
│   │   ├── services/      # adminService API 层（60+ 接口）
│   │   ├── common/        # 公共工具（request/validate）
│   │   └── composables/   # 组合式函数
│   ├── tests/             # 管理后台测试
│   └── package.json
├── backend/               # Express.js 后端
│   ├── src/
│   │   ├── controllers/   # 28 个控制器模块
│   │   ├── services/      # 服务层
│   │   ├── models/        # 42 个数据模型
│   │   ├── routes/        # 175+ API 路由
│   │   ├── middlewares/   # 认证/安全/限流中间件
│   │   ├── socket/        # WebSocket 实时通信
│   │   ├── config/        # 配置（本地DB/JWT/Redis等）
│   │   └── data/          # 种子数据 + JSON 持久化
│   ├── server.js          # 入口文件
│   ├── tests/             # 14 个测试文件，189 个用例
│   └── package.json
├── docker-compose.yml     # Docker 编排
├── README.md              # 项目总览
└── QUICKSTART.md          # 本文件
```

## 开发命令速查

| 子项目 | 启动 | 测试 | Lint | 格式化 |
|--------|------|------|------|--------|
| backend | `npm run dev` | `npm test` | `npm run lint` | `npx prettier --write src/` |
| frontend | `npm run dev` | `npm test` | `npm run lint` | `npm run format` |
| admin-frontend | `npm run dev` | `npm test` | `npm run lint` | `npm run format` |

## 文档索引

| 文档 | 说明 |
|------|------|
| [项目 README](file:///home/devbox/project/kaifa/README.md) | 项目总览与技术栈 |
| [后端部署文档](file:///home/devbox/project/kaifa/backend/部署文档.md) | 生产环境部署指南（Nginx/PM2/安全加固） |
| [后端API接口文档](file:///home/devbox/project/kaifa/backend/后端API接口文档.md) | 全部 API 接口说明 |
| [数据库设计文档](file:///home/devbox/project/kaifa/backend/数据库设计文档.md) | MySQL/MongoDB 表结构 |
| [数据字典](file:///home/devbox/project/kaifa/backend/数据字典文档.md) | 字段定义与说明 |
| [后端开发文档](file:///home/devbox/project/kaifa/backend/开发文档.md) | 开发规范与架构 |
| [后端测试指南](file:///home/devbox/project/kaifa/backend/测试指南.md) | 后端测试框架与命令 |
| [前端技术文档](file:///home/devbox/project/kaifa/frontend/技术文档.md) | 前端架构/路由/组件说明 |
| [前端功能文档](file:///home/devbox/project/kaifa/frontend/功能文档.md) | 页面功能与模块说明 |
| [前端测试指南](file:///home/devbox/project/kaifa/frontend/tests/测试运行指南.md) | 前端测试框架与编写规范 |