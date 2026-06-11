# 多客陪玩平台 (Duoke Companion)

> v3.0.0 — 商业版陪玩平台，前后端分离架构

## 项目简介

多客陪玩是一个功能完整的商业陪玩平台，包含用户端、管理后台和后端 API 服务。支持游戏陪玩、虚拟陪聊、礼物打赏、VIP 会员、密卡充值等核心业务场景。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 用户前端 | Vue 3 + Vite + Pinia | 57 个页面，响应式设计 |
| 管理后台 | Vue 3 + Vite | 25 个管理页面，暗黑模式支持 |
| 后端 | Node.js + Express | 28 个模块，175+ API 端点 |
| 数据库 | MySQL + Redis + MongoDB | 开发模式支持本地 JSON 模拟 |
| 认证 | JWT 双令牌 + PBKDF2 | Access Token + Refresh Token |
| 实时通信 | WebSocket (Socket.IO) | 聊天、通知推送 |
| 测试 | Jest + Vitest | 后端 189 用例，前后端测试框架 |

## 快速开始

详见 [QUICKSTART.md](./QUICKSTART.md)

```bash
# 开发模式（无需外部数据库）
cd backend && npm install && npm run dev      # 后端 → :3001
cd frontend && npm install && npm run dev      # 前端 → :8082
cd admin-frontend && npm install && npm run dev # 管理后台 → :8081
```

## 项目结构

```
kaifa/
├── frontend/           # Vue 3 用户前端 (57 pages)
├── admin-frontend/     # Vue 3 管理后台 (25 pages)
├── backend/            # Express.js API 服务 (28 modules)
├── docker-compose.yml  # Docker 部署编排
├── README.md           # 本文件
└── QUICKSTART.md       # 快速启动指南
```

## 功能模块

### 用户端
- 用户注册/登录（手机号/微信/第三方）
- 陪玩师发现与匹配
- 在线聊天（WebSocket 实时通信）
- 动态/帖子发布与互动
- 礼物打赏系统
- VIP 会员体系
- 密卡充值
- 提现管理
- 虚拟陪聊机器人

### 管理后台
- 数据仪表盘（统计概览 + 7日趋势图）
- 用户管理（列表/详情/状态/封禁）
- 管理员管理（角色权限/密码管理）
- 订单管理（订单列表/详情/状态流转）
- 提现审核（申请列表/审批/驳回）
- 内容管理（帖子/举报/Banner）
- 交易管理（密卡/礼物/充值记录）
- 服务管理（服务分类/陪玩申请/VIP套餐）
- 系统通知（创建/推送/统计）
- 系统设置（基础配置/LLM模型/第三方登录开关）
- 全局搜索（用户/订单/帖子跨模块检索）
- 暗黑模式支持

## 测试

```bash
# 后端测试（14 suites / 189 tests）
cd backend && npm test

# 管理后台测试
cd admin-frontend && npm test
```

## 文档

| 文档 | 路径 |
|------|------|
| 快速启动 | [QUICKSTART.md](./QUICKSTART.md) |
| 后端部署 | [backend/部署文档.md](./backend/部署文档.md) |
| API 接口 | [backend/后端API接口文档.md](./backend/后端API接口文档.md) |
| 数据库设计 | [backend/数据库设计文档.md](./backend/数据库设计文档.md) |
| 数据字典 | [backend/数据字典文档.md](./backend/数据字典文档.md) |
| 后端开发 | [backend/开发文档.md](./backend/开发文档.md) |
| 前端技术 | [frontend/技术文档.md](./frontend/技术文档.md) |
| 前端功能 | [frontend/功能文档.md](./frontend/功能文档.md) |

## 安全特性

- JWT 双令牌认证（Access + Refresh Token）
- PBKDF2 密码加密（管理员密码 bcrypt）
- 登录频率限制 + 锁定机制
- API 限流保护
- CSRF 防护
- 开发模式安全隔离（双重检查）
- 微信支付回调时间戳验证
