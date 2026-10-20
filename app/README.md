# eu搭子用户端（uni-app 迁移版）

由原 `frontend/`（Vue3 + Vite SPA）迁移而来，一套代码同时产出 H5 与 App 资源。旧站 `frontend/` 已于 2026-10-21 删除，备份见 `.e2e-run/legacy-frontend-backup-2026-10-21/`（不含 node_modules，不入库）。

## 常用命令

本机全局没有 pnpm 时用 `npx --yes pnpm@10.15.0 <script>`：

```bash
pnpm install
pnpm dev:h5          # H5 开发服务器 http://127.0.0.1:5174
pnpm build:h5        # H5 产物 dist/build/h5
pnpm build:app       # App 资源 dist/build/app（HBuilderX 导入；会编译 UTS 插件）
pnpm task:auto       # 环境检查→安装→单测→构建→53 页冒烟→App资源→报告
pnpm task:smoke      # 静态预览 + Chrome 全页面矩阵冒烟
pnpm task:report     # 汇总报告
pnpm task:context    # 查看上下文使用量（70% 阈值）
```

## 目录

- `src/pages/`：58 个页面文件（原 views；54 条在 `src/pages.json` 注册，含 NotFound；另 4 个是入驻申请子表单组件，由 CompanionApply 内嵌）
- `src/components/`：公共组件（含 GlobalUI）
- `src/services/`、`src/store/`、`src/common/`：原逻辑迁移
- `src/services/mediaPicker.js`：App 选图/选视频（H5 回退 `<input type=file>`）
- `src/services/audioRecorder.js`：App 录音（uni.getRecorderManager 单例封装；H5 仍用 MediaRecorder）
- `src/common/storage.js`：统一存储适配器（uni.storage 与 localStorage 双写、读取 uni 优先回落），token/持久化/偏好共用
- `tests/mocks/uni-app.js`：vitest 下 `@dcloudio/uni-app` 生命周期替身（alias 在 `vitest.config.mjs`）
- `src/services/nativeCallAdapter.js` / `nativeCallService.js`：App 原生 WebRTC 通道
- `src/uni_modules/kaifa-webrtc/`：Android WebRTC UTS 插件（Kotlin 未真机编译验证）
- `src/common/route.js`：uni-app 路由兼容层（替换 vue-router）
- `scripts/`：自动化任务与说明（现行手册 `scripts/README.md`）；`automation/`：任务清单 `tasks.json`（被 `scripts/task-auto.mjs` 硬依赖）与运行产物
- `DEPLOY-H5.md`：替换 nginx 旧 H5 的说明
- `PACKAGING.md`：HBuilderX Android 打包说明

## 线上环境（2026-10-20 已部署）

- H5 / 管理后台 / API：`https://fazwhznenrqo.sealoshzh.site`；线上镜像 `kaifa-app:v1.0.9`
- 部署事实记录：`deploy/sealos/DEPLOYED-2026-10-20.md`；唯一上线核对表：根目录 `Sealos部署核对清单.md`

## 迁移完整性（2026-10-21 复核；结构层已 1:1，功能层缺口已收口）

- 旧站 `frontend/src` 135 个文件全部有对应；58 个 views → `src/pages/` 58 个页面文件，其中 54 条在 `src/pages.json` 注册（含 NotFound；另 4 个是申请表单子组件）
- 路由：53 条路由表（`src/common/routes.js`，另有 1 条 NotFound 走 `onPageNotFound`）/ 45 条 requiresAuth / 7 条 fullscreen；旧路径由 `src/static/legacy-redirect.js` 入口改写（46 条静态 + 6 条动态，含 `/records-center`）
- 174 个唯一 `/api/*` 字面量与旧站集合差 0；socket 事件名集合差 0；`vue-router` 残留 import = 0（仅注释）
- 页面级内容相似度 95.5%–100%；差异仅限预期兼容改造：vue-router → `src/common/route.js`、fetch → `uni.request`、登录表单 submit → click、上传/原生通话/App 平台分支新增
- 2026-10-21 收口批：聊天选图/选视频与三处录音接 `mediaPicker`/`audioRecorder`；登录补第三方登录入口；`/` 路由解析、深链登录回跳、App 冷启动、`/records-center` 旧链接、token/pinia/偏好存储统一；`onShow` 静默刷新（32 页）；定位/剪贴板/分享/预览/网络状态/表单 picker 等平台化。详见《前端功能差异清单》§11.8

## 关键文件（来源 automation/HANDOFF §六，该文件已归档）

| 关注点 | 文件 |
|---|---|
| App 上传链路 | `src/services/mediaPicker.js`、`src/services/uploadService.js` |
| 原生通话 | `src/services/nativeCallAdapter.js`、`nativeCallService.js`、`webrtcCallService.js` |
| 路由兼容层 | `src/common/route.js`（含 `router.options`、页面切换方向） |
| 全局 UI / 错误兜底 | `src/components/GlobalUI.vue`、`src/components/PageLayout.vue`、`src/composables/useGlobalError.js` |
| UTS 插件 | `src/uni_modules/kaifa-webrtc/README.md` |

## 当前边界（2026-10-21）

- 线上已部署（Sealos，`kaifa-app:v1.0.9`，`/api/health` 200）；本批修复已于 2026-10-21 发版生效
- 验证现状：`app` vitest 25 文件/251 例在宿主进程内实跑通过；79 个 SFC 编译通过；`uni build`（H5/App）与真机未执行（宿主 shell 不可用）
- App 上传链路已接入（`VITE_USE_NATIVE_CALL` 不影响上传）；H5 行为保持不变
- App 通话默认仍走浏览器 WebRTC；打自定义基座且 `VITE_USE_NATIVE_CALL=1` 时切到原生插件
- 原生插件的 Kotlin 编译、真机通话/权限/保音/视频层级、真机上传/socket/录音/定位仍需 HBuilderX + 真机验证
- 2026-10-21 残余 P2 已收口：`span`/`p` 全部转 `text`/`view`（模板 + CSS 选择器同步）；主 Tab 用 `common/tabState.js` 恢复状态（快照+TTL+账号隔离+uni.storage 双写，App 跨 WebView 生效）；VipCenter/Recharge/视频缩略图/邮箱/通话开关已修
- 剩余已知差异：App 分享链接依赖构建期 `VITE_API_ORIGIN`；AudioCall/VideoCall 仍直读 `_pendingCallMode` 的 localStorage（写入端已双写）；App 邮箱无专用键盘（已格式校验兜底）
- P2P 取数在 App 端回退签名 URL；iOS 未适配
- 旧站 `frontend/` 已删除：`docker-compose.yml` 站点根改挂 `app/dist/build/h5`；文档中的 `frontend/...` 路径均为整改前证据引用，以备份为准
