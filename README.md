# 多客陪玩（kaifa）

陪玩社交平台全栈项目：用户端 + 管理后台 + Node.js 后端，支持 Docker 一键部署。

## 项目结构

```
kaifa/
├── backend/          # 后端服务（Express + Sequelize + MySQL + Mongo + Redis + Socket.io）
├── frontend/         # 用户端前端（Vue 3 + Pinia + Vite + TypeScript）
├── admin-frontend/   # 管理后台前端（Vue 3 + Vue Router + Vite）
├── landing/          # 官网落地页（纯静态）
├── eudazi-starter/   # 项目初始模板（参考用）
├── nginx/            # Nginx 配置（API 代理 / WebSocket / 静态托管）
├── docker-compose.yml        # 生产编排（nginx/backend/mysql/mongo/redis）
├── docker-compose.dev.yml    # 开发编排（仅数据库）
└── .env.example      # 环境变量模板
```

## 快速启动

### Docker 一键部署（推荐）

```bash
cp .env.example .env   # 填入真实密钥（数据库密码、JWT_SECRET、微信支付等）
docker compose up -d --build
```

启动后：
- 用户端：http://localhost
- 管理后台：http://localhost/admin
- API 健康检查：http://localhost/api/health

### 本地开发

```bash
# 1. 启动数据库（仅 mysql/mongo/redis）
docker compose -f docker-compose.dev.yml up -d

# 2. 后端（端口 3000）
cd backend && cp .env.example .env && npm install && npm run dev

# 3. 用户端前端（端口 5173）
cd frontend && npm install && npm run dev

# 4. 管理后台（端口 5174）
cd admin-frontend && npm install && npm run dev
```

## 核心功能模块

用户：登录/聊天（Socket.io）/ 礼物打赏 / 充值提现 / 陪玩预约 / 游戏开黑 / 直播（TRTC）/ 圈子动态 / VIP 会员
管理端：仪表盘 / 用户管理 / 订单财务 / 内容审核 / 虚拟用户运营 / Banner·公告配置

## 测试

```bash
cd backend && npm test        # Jest（单元 + 集成，含 50% 覆盖率阈值）
cd frontend && npm run test   # Vitest
```

## 文档索引

### 后端（backend/）

| 文档 | 位置 |
|---|---|
| 后端 API 接口文档 | `backend/后端API接口文档.md` |
| 后端开发文档 | `backend/开发文档.md` |
| 部署文档 | `backend/部署文档.md` |
| 数据库设计文档 | `backend/数据库设计文档.md` |
| 测试指南 | `backend/测试指南.md` |
| SQL 脚本归档说明 | `backend/sql/ARCHIVE_NOTES.md` |

### 前端（frontend/）

| 文档 | 位置 |
|---|---|
| 前端技术文档 | `frontend/技术文档.md` |
| 已完成功能清单 | `frontend/已完成功能清单.md` |
| 前后端功能对比分析报告 | `frontend/前后端功能对比分析报告.md` |
| 前后端功能拆解开发指导 | `frontend/前后端功能拆解开发指导.md` |
| 测试运行指南 | `frontend/tests/测试运行指南.md` |

## 注意事项

- `.env` 含敏感密钥，已被 .gitignore 忽略，严禁提交。
- `backend/sql/` 下的 fix_*.sql 为历史修复脚本，执行前务必阅读 `ARCHIVE_NOTES.md` 确认执行状态，避免重复执行覆盖数据。
- 生产部署前：
  - 更换 `.env` 与 docker-compose 中的默认弱密码（后端启动时若仍检测到弱值会打印安全告警，不阻断启动）。
  - 启用 HTTPS：使用 Let's Encrypt 证书，certbot 容器已配（profiles 隔离，默认不启动），步骤见 `.workbuddy/生产证书部署指南.md`。
  - 健康检查：部署后访问 `/api/health`，应返回 `status: healthy` 且依赖 `mysql/mongo/redis` 均为 `up`（核心依赖 MySQL 不可达会返回 503）。
  - 横向扩展：Socket.IO 已接入 Redis adapter，可水平扩展 backend 副本；确保各副本连接同一 Redis 实例。
  - 前端测试：`frontend` 已配 Vitest（`npm run test:unit`，48 项通过）；`admin-frontend` 已起步（`npm run test:unit`，Vitest + happy-dom）。
