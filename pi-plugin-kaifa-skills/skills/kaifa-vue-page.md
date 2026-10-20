---
name: kaifa-vue-page
description: "在 kaifa 的 Vue 3 前端（用户端 app/（uni-app 迁移版）或管理端 admin-frontend/）新增或修改页面、路由、service、Pinia store，并配 vitest 视图测试。当改动落在两个前端目录、要加页面或接接口时使用。"
whenToUse: "任务要新增/修改页面、组件、路由或接口调用；改动点位于 app/src、app/tests、admin-frontend/src 或 admin-frontend/tests（旧站 frontend/ 已于 2026-10-21 删除，备份在 .e2e-run/legacy-frontend-backup-2026-10-21/）。"
tags: ["自习"]
---

# kaifa 前端页面开发

工作区根：`C:\Users\admin\Desktop\kaifa`。

## When to Use

- 改动点在 `app/src/**`、`app/tests/**`、`admin-frontend/src/**` 或 `admin-frontend/tests/**`。旧站 `frontend/` 已删除，勿再按旧路径施工。
- 不适用：只改后端 → `kaifa-backend-feature`；只改文档 → `kaifa-doc-sync`。

## 环境口径（PI-Desktop 本机实测）

- 宿主 shell 是 **Windows PowerShell**：命令串联用 `;`，不要用 `&&`。
- `node v24.21.0` / `npm 11.19.0` **可用** → vitest 与 vite build 直接跑。
- `docker` / `git` 不在 PATH。
- 读中文文件用 `Get-Content -Encoding UTF8`。

## Procedure

### 1. 两套应用别混

| | 用户端（uni-app） | 管理端 |
|---|---|---|
| 目录 | `app/` | `admin-frontend/` |
| 端口(联调) | 5174（`pnpm dev:h5`） | 5175 |
| 路由 | `src/pages.json`（注册）+ `src/common/routes.js`（命名路由真源） | `src/router` 同构 |
| 状态 | Pinia（`src/store/*.js`，persistedState 插件） | 以页面内状态为主 |
| 请求 | `src/common/common.js` 的 `request`（uni.request） | `src/common/common.js` 的 `request` |
| 测试环境 | vitest + jsdom（`app/vitest.config.mjs`，`@dcloudio/uni-app` alias 到 `tests/mocks/uni-app.js`） | vitest + happy-dom（`admin-frontend/vitest.config.ts`） |

管理端 lint 自 2026-10-21 起改为使用 admin-frontend 本地 `eslint` + `eslint-plugin-vue`（已写入 devDependencies；旧站删除后不再借 `../frontend/node_modules`，首次需 `npm install` 更新锁文件）。`npm run lint` 在 admin-frontend 目录执行。

### 2. 用户端新增一个页面（uni-app，按序）

1. 页面 `app/src/pages/<Name>.vue`（大驼峰，与路由 name 一致）。
2. 服务 `app/src/services/<x>Service.js`：默认导出对象，内部用 `import { request } from '../common/common'`；新接口优先复用已有 service，不要在建视图里直接 fetch/fetch。
3. 路由双处登记：`app/src/pages.json` 的 `pages` 数组加 `pages/<Name>`；`app/src/common/routes.js` 加 `{ path, name, page, view, requiresAuth, fullscreen }`（路由真源，guard/白名单据此）；登录态与公开白名单在 `src/common/constants.js`。
4. 页面生命周期用 `import { onShow, onLoad, onPageScroll, onReachBottom } from '@dcloudio/uni-app'`（列表页返回刷新用 onShow 静默刷新 + `__firstShow` 跳过首帧）。
5. 平台差异：H5/App 双分支用 `src/common/platform.js` 的 `isApp`/`isH5`；选图/视频用 `services/mediaPicker.js`、录音用 `services/audioRecorder.js`、存储用 `common/storage.js`、路由用 `common/route.js`（`router.push/navigateTo`）。
6. 提示统一用 `useToast`（`src/composables/useToast.js`）；权限判断用 `usePermissions`（App 走 uni.authorize）。

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
vi.mock('@/common/route', () => ({ useRouter: () => router, useRoute: () => ({ path: '/x', query: {}, meta: {} }), canResolve: () => true }));
vi.mock('@dcloudio/uni-app', () => ({ onShow: vi.fn(), onLoad: vi.fn(), onReachBottom: vi.fn(), onPageScroll: vi.fn(), onHide: vi.fn(), onUnload: vi.fn() }));

import Page from '@/pages/Page.vue';   // 必须在 mock 之后 import
```

- 用户端别名：`@` → `app/src`（见 `app/vitest.config.mjs`）；uni-app 只有 `@` 一个别名，组件/服务用相对路径导入。
- 测试放 `app/tests/{views,store,common,services,composables,utils}/`，管理端 `admin-frontend/tests/`。
- 断言数据来自服务端：先 `mockResolvedValue({ data: payload })` 再 `mount` + `await flushPromises()`。

## Verification

```powershell
cd app; npx vitest run tests/views/x.test.js
cd app; npx vitest run                              # 全量 25 文件/251 例（2026-10-21 基线）
cd app; npx --yes pnpm@10.15.0 build:h5              # build 必跑：页面/模板/动态导入错误只在构建期暴露
cd admin-frontend; npx vitest run; npm run build
cd admin-frontend; npm run lint                     # 在 admin-frontend 目录执行（本地 eslint）
```

## Pitfalls

- 页面文件存在但忘记在 `pages.json` 注册 → 运行时找不到页面；路由名和 `routes.js`/`pages.json` 不一致 → navigateTo 失败。
- 模板只用 `view`/`text`/`image` 等 uni 组件，禁止新增 `div`/`img`/`span`/`p`；DOM/浏览器 API 必须放 `isH5` 分支。
- 列表页只在 `onMounted` 加载会在 App 返回时不刷新，需补 `onShow`（首帧跳过）。
- 视图里直接 `axios/fetch`：请求头、401 跳转、base 路径都会和 `request` 不一致。
- 用户端覆盖率门槛只统计 `src/store`、`src/common`、`src/tools`（阈值 75），视图不计入，但视图测试仍要写。
- 改前端接口字段后忘了同步 `前端功能差异清单.md` / 联调清单 → 用 `kaifa-doc-sync`。
- 管理端新增页面若默认 `role_id: 1`（超管）会在提交时命中服务端 403 —— 见 `kaifa-permission-key` 的 A-1。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
目标：在 C:\Users\admin\Desktop\kaifa 实现 <页面/路由/service>（用户端 app/（uni-app）或管理端 admin-frontend/）。
硬约束：页面在 app/src/pages/，并在 app/src/pages.json 与 app/src/common/routes.js 双处登记；接口写在 app/src/services/*Service.js
（用 common/common 的 request，不要直接用 uni.request/fetch）；列表页补 onShow 静默刷新；模板只用 view/text/image；
H5/App 差异用 common/platform.js + common/route.js + services/mediaPicker/audioRecorder + common/storage.js；提示用 useToast；
管理端权限键必须与 backend/src/utils/permissions.js 一致。
环境：Windows PowerShell（用 ; 不用 &&），node/npm/pnpm 可用，中文文件读用 -Encoding UTF8。
验证：cd app; npx vitest run <对应测试>；再全量 npx vitest run 与 pnpm build:h5（必须跑 build）。
报告：改了哪些文件、测试与构建退出码、失败原文、未验证项及原因。
```
