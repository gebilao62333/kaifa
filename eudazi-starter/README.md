# 多可 · 开箱即用启动项目（eudazi-starter）

一个**自包含、零重依赖、单命令启动**的最小完整后端项目，涵盖下载管理、官网落地页与可视化后台。
代码结构遵循 **高内聚、低耦合**：配置 / 工具 / 中间件 / 数据层 / 业务层 / 控制层 / 路由层 各司其职。

## 目录结构

```
eudazi-starter/
├── server.js                 # 进程入口
├── package.json              # 依赖与脚本
├── .env.example              # 环境变量样例（复制为 .env 使用）
├── README.md                 # 说明文档
├── public/                   # 静态资源（同源部署，无需跨域）
│   ├── index.html            # 官网落地页（三端下载按钮）
│   └── admin.html            # 可视化后台管理
├── src/
│   ├── app.js                # Express 应用组装（中间件 + 路由 + 静态 + 错误处理）
│   ├── config/               # 配置层
│   │   ├── index.js          # 集中配置（端口 / JWT / 管理员账号）
│   │   └── jwt.js            # JWT 签发与校验
│   ├── utils/                # 工具层
│   │   ├── response.js       # 统一响应格式
│   │   └── decode.js         # HTML 实体解码（修复 XSS 转义致链接失效）
│   ├── middlewares/          # 中间件层
│   │   ├── security.js       # 轻量 XSS 转义
│   │   ├── auth.js           # 管理员鉴权
│   │   └── index.js          # 中间件出口
│   ├── repositories/         # 数据访问层（内存实现，可替换为 DB）
│   │   └── downloadRepository.js
│   ├── services/             # 业务逻辑层（核心规则，不依赖 HTTP）
│   │   └── downloadService.js
│   ├── controllers/          # 控制层（薄转发）
│   │   ├── download.js
│   │   └── admin.js
│   └── routes/               # 路由层
│       ├── index.js          # 路由注册中心
│       ├── download.js       # 公开下载接口
│       └── admin.js          # 后台接口（含登录）
└── test/
    └── verify.js             # 逻辑 + HTTP 冒烟验证
```

## 环境要求

- **Node.js >= 16**（推荐 18+，验证脚本依赖全局 `fetch`）
- 无需数据库、Redis、MQ 等任何外部服务

## 快速开始

```bash
# 1. 进入项目目录
cd eudazi-starter

# 2. 安装依赖（仅 4 个：express / cors / jsonwebtoken / dotenv）
npm install

# 3.（可选）配置环境变量
cp .env.example .env
#   默认端口 3000，管理员 admin / admin123

# 4. 启动服务
npm start
```

启动成功后访问：

| 页面 | 地址 |
| --- | --- |
| 落地页 | http://localhost:3000/ |
| 后台管理 | http://localhost:3000/admin.html |
| 健康检查 | http://localhost:3000/api/health |
| 公开下载 API | http://localhost:3000/api/download/platforms |

## 功能验证

```bash
npm run verify
```

脚本会执行：
1. **业务逻辑单测**：下载项的增删改查、状态过滤、XSS 链接解码、非法平台拦截。
2. **HTTP 冒烟测试**：启动服务后验证健康检查、登录拿 token、鉴权拦截、CRUD、公开接口解码。

全部通过即代表项目可无报错正常运行。

## 核心接口一览

### 公开接口（无需鉴权）
- `GET /api/download/platforms` — 获取已启用且配置了地址的下载项列表
- `GET /api/download/:platform` — 按平台 302 跳转（`ios` / `android` / `harmony`）

### 后台接口（需 `x-admin-token`）
- `POST /api/admin/login` — 管理员登录，返回 `token`
- `GET  /api/admin/downloads` — 列表（支持 platform / status / keyword / page / pageSize）
- `GET  /api/admin/downloads/:id` — 详情
- `POST /api/admin/downloads` — 新增（platform / version / url / size / sort / status）
- `PUT  /api/admin/downloads/:id` — 更新
- `PATCH /api/admin/downloads/:id/status` — 启停
- `DELETE /api/admin/downloads/:id` — 删除

后台调用示例（curl）：

```bash
# 登录
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).data.token))")

# 新增安卓下载地址
curl -X POST http://localhost:3000/api/admin/downloads \
  -H "x-admin-token: $TOKEN" -H 'Content-Type: application/json' \
  -d '{"platform":"android","version":"3.1.0","url":"https://eudazi.com/apk/eudazi.apk","status":1}'
```

## 低耦合设计说明

- **依赖倒置**：`service` 仅依赖 `repository` 抽象，接入 MySQL/MongoDB 时只需替换 `downloadRepository.js`，上层无需改动。
- **控制层薄化**：`controller` 只做请求解析与响应组装，不含业务规则，便于单元测试。
- **配置集中**：所有环境变量在 `config/index.js` 收敛，改密钥/端口/账号只动一处。
- **安全与解码分离**：`security.js` 负责输入转义，`decode.js` 负责输出解码，互不污染。

> 注：当前数据为**内存存储**，重启即重置（与演示定位一致）。生产环境请将 `downloadRepository` 替换为数据库实现，并通过 `config/admin.token` 关闭应急令牌、为 `JWT_SECRET` 配置强随机值。
