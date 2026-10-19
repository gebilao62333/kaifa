---
name: kaifa-vue-page
description: "在 kaifa 的 Vue 3 前端（用户端 frontend/ 或管理端 admin-frontend/）新增或修改页面、路由、service、Pinia store，并配 vitest 视图测试。当改动落在两个前端目录、要加页面或接接口时使用。"
whenToUse: "任务要新增/修改页面、组件、路由或接口调用；改动点位于 frontend/src、frontend/tests、admin-frontend/src 或 admin-frontend/tests。"
tags: ["自习"]
---

# kaifa 前端页面开发

工作区根：`C:\Users\admin\Desktop\kaifa`。

## When to Use

- 改动点在 `frontend/src/**`、`frontend/tests/**`、`admin-frontend/src/**` 或 `admin-frontend/tests/**`。
- 不适用：只改后端 → `kaifa-backend-feature`；只改文档 → `kaifa-doc-sync`。

## 环境口径（PI-Desktop 本机实测）

- 宿主 shell 是 **Windows PowerShell**：命令串联用 `;`，不要用 `&&`。
- `node v24.21.0` / `npm 11.19.0` **可用** → vitest 与 vite build 直接跑。
- `docker` / `git` 不在 PATH。
- 读中文文件用 `Get-Content -Encoding UTF8`。

## Procedure

### 1. 两套应用别混

| | 用户端 | 管理端 |
|---|---|---|
| 目录 | `frontend/` | `admin-frontend/` |
| 端口(联调) | 5174 | 5175 |
| 路由 | `src/router/index.js`（`createWebHistory`） | `src/router` 同构 |
| 状态 | Pinia（`src/store/*.js`，persistedState 插件） | 以页面内状态为主 |
| 请求 | `src/common/common.js` 的 `request` | `src/common/common.js` 的 `request` |
| 测试环境 | vitest + jsdom（`frontend/vitest.config.ts`） | vitest + happy-dom（`admin-frontend/vitest.config.ts`） |

管理端的 lint 借用户端的 eslint：`npm run lint` **必须在 admin-frontend 目录执行**（脚本里写死了 `../frontend/node_modules/eslint`）。

### 2. 用户端新增一个页面（按序）

1. 视图 `frontend/src/views/<Name>.vue`（大驼峰，与路由 name 一致）。
2. 服务 `frontend/src/services/<x>Service.js`：默认导出对象，内部用 `import { request } from '../common/common'`；新接口优先复用已有 service，不要在建视图里直接 fetch。
3. 路由 `frontend/src/router/index.js`：加 `{ path: '/xxx', name: 'Xxx', component: lazyLoad('Xxx'), meta: { title: '...' } }`。`lazyLoad` 是模板字符串动态 import，**组件名写错只在构建期炸**，必须跑一次 `npm run build`。
4. 需登录的页面依赖路由守卫 + `src/common/constants.js` 的 `PUBLIC_ROUTE_NAMES`/`isPublicPath`；白名单新页面要同步常量，别在守卫里加特例字符串。
5. 提示统一用 `useToast`（`src/composables/useToast.js`）；权限判断用 `usePermissions`。

### 3. 管理端新增一个页面

1. 视图放 `admin-frontend/src/views/`（后台模块放 `views/admin/`），无权限页参考 `views/NoPermission.vue`。
2. 服务 `admin-frontend/src/services/adminService.js` 或同目录新 service；登录/登出类请求要带 `{ skipAuthRedirect: true }`，否则 401 会触发整页跳转。
3. 权限键与后端 `backend/src/utils/permissions.js` 保持一致（`<模块>:<action>`，read=查看、write=管理），菜单与按钮显隐据此判断；细节与已知坑见 `kaifa-permission-key`。

### 4. 测试模板（vitest + @vue/test-utils）

```js
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { svc, toast, router } = vi.hoisted(() => ({
  svc: { get: vi.fn(), submit: vi.fn() },
  toast: { show: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}));
vi.mock('@/services/xService', () => ({ default: svc }));
vi.mock('@/composables/useToast', () => ({ toast }));
vi.mock('vue-router', () => ({ useRouter: () => router }));

import Page from '@/views/Page.vue';   // 必须在 mock 之后 import
```

- 用户端别名：`@`、`@components`、`@utils`、`@static`（见 `frontend/vitest.config.ts`）；管理端无别名。
- 测试放 `frontend/tests/{views,store,common,utils}/`，管理端 `admin-frontend/tests/`。
- 断言数据来自服务端：先 `mockResolvedValue({ data: payload })` 再 `mount` + `await flushPromises()`。

## Verification

```powershell
cd frontend; npx vitest run tests/views/x.test.js
cd frontend; npm run test:unit; npm run build      # build 必跑：动态 import 写错只在构建期暴露
cd admin-frontend; npx vitest run; npm run build
cd admin-frontend; npm run lint                    # 必须在 admin-frontend 目录执行
```

## Pitfalls

- `lazyLoad('Xxx')` 对应的 `.vue` 不存在 → dev 里 404、build 才报错。
- 视图里直接 `axios/fetch`：请求头、401 跳转、base 路径都会和 `request` 不一致。
- 用户端覆盖率门槛只统计 `src/store`、`src/common`、`src/tools`（阈值 75），视图不计入，但视图测试仍要写。
- 改前端接口字段后忘了同步 `前端功能差异清单.md` / 联调清单 → 用 `kaifa-doc-sync`。
- 管理端新增页面若默认 `role_id: 1`（超管）会在提交时命中服务端 403 —— 见 `kaifa-permission-key` 的 A-1。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
目标：在 C:\Users\admin\Desktop\kaifa 实现 <页面/路由/service>（用户端 frontend/ 或管理端 admin-frontend/）。
硬约束：视图在 src/views（管理端后台页在 views/admin/）；接口调用写在 src/services/*Service.js（用 common/common 的
request，不要直接 fetch）；路由用 lazyLoad('Name')；需登录页面同步 constants.js 白名单；提示用 useToast；
管理端权限键必须与 backend/src/utils/permissions.js 一致。
环境：Windows PowerShell（用 ; 不用 &&），node/npm 可用，中文文件读用 -Encoding UTF8。
验证：npx vitest run <对应测试>，然后 npm run test:unit 与 npm run build（必须跑 build）。
报告：改了哪些文件、测试与构建退出码、失败原文、未验证项及原因。
```
