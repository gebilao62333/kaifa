# 迁移状态总览（自动生成）

- 更新时间：2026-10-20 22:30（Asia/Shanghai，文档整治轮；状态事实截止 2026-10-20 16:07）
- 范围：`app/` 迁移 + Sealos 部署产物（`Dockerfile.web`、`deploy/sealos/`、根 `Dockerfile`/`.dockerignore`）；`backend/` 业务代码未动
- 上下文：约 21%（阈值 70%）
- 最近全链路：`task:auto` **总体 pass**（install → test → build-h5 → smoke → build-app → report）

## 2026-10-21 迁移缺口收口批（frontend → app 审计整改）

- 背景：2026-10-21 只读迁移审计（`.e2e-run/migration-audit/00-summary.md` + 01/02/03）确认结构层已 1:1（58 页/53 路由/34→37 服务/18→20 组件、`/api` 端点集合差 0），功能层有 2 项 P0、6 项 P1、批量 P2 缺口。
- 残余 P2（2026-10-21 第二批）：span 1155 对/p 24 对全量转 `text`/`view`（CSS 选择器同步）；新增 `common/tabState.js`（快照+30s TTL+账号隔离+uni.storage 双写）恢复主 Tab 状态；VipCenter 刷新保留选择、Recharge 失败不回退本地余额、App 视频缩略图改占位、邮箱格式校验、通话开关改 uni switch；**旧站 `frontend/` 已删除**（备份 `.e2e-run/legacy-frontend-backup-2026-10-21/`，compose 站点根改挂 `app/dist/build/h5`）。
- P0：聊天选图/选视频接 `mediaPicker`；新增 `services/audioRecorder.js`（uni.getRecorderManager），聊天/入驻/语音介绍三处录音双分支；MyServices 删除「待接入」抛错；申请表单子组件补 App 试听。
- P1：Login 补第三方登录入口；`resolve('/')`→Home、真实 fullPath、`canResolve`；`legacy-redirect` 补 `/records-center`；App 冷启动已登录 `reLaunch(Home)`；新增 `common/storage.js` 统一 token/pinia/偏好存储（双写、uni 优先回落）。
- P2：32 页 `onShow` 静默刷新；manifest 补定位权限；定位/剪贴板/分享/预览/网络状态/权限探测/表单 picker/confirm 平台化；GameIndex 字段归一化召回；删除 `v-lazy`/`v-img-fallback` 死代码；vitest 增 `@dcloudio/uni-app` no-op alias。
- 验证：`app` vitest **25 文件 / 251 例进程内实跑全过**（runner `.e2e-run/migration-audit/run-vitest.mjs`）；`app/src` 79 SFC 编译通过 + 65 JS 解析通过；`uni build`（H5/App）与真机未执行（宿主 shell 不可用）。
- 已上线（2026-10-21）：线上镜像 `kaifa-app:v1.0.11`，本批代码已生效。
- 详见《前端功能差异清单》§11.8、《未完成事项清单》§8.4、《用户端功能完整度检查报告》§11。
## 2026-10-20 镜像轮（frontend C 端改动 → app/）

- 移植：ChatRoom 红包领取/转发类型、RedPacketPanel packetNo、MyOrder 评价态/文案/失败刷新、MyReserve 接单方+可约时段、SkinShop 装扮桥接、Login/CardRecharge 429 倒计时、Settings 隐私开关落库
- Lead 侧：common.js（429 retryAfterSec + refresh_token 静默续期）、constants（REFRESH_TOKEN）、store（token 存取/清理）、reserveService（role/includeDisabled/toggleSlot）、新增 utils/skinBridge.js
- 验证：`uni build`（H5）成功；vitest 25 文件/252 用例全通过；53 页 H5 冒烟 pageErrors=0/consoleErrors=0（`.dsh/trash-2026-10-20T08-33-34-233Z/app/.automation/smoke-20261020-134155.json`；原 `app/.automation/` 已整体归档）
- 边界：时段管理使用 H5 原生 date/time 与 confirm/prompt，App 端需换 uni picker/showModal；真机未验证

## 本轮（2026-10-20）完成

### 1. App 上传链路（mediaPicker）
- `services/mediaPicker.js`：App 端 `uni.chooseImage/chooseVideo` → 统一 `{ path,name,type,size }`，扩展名补 MIME、取消选择不报错
- `services/uploadService.js`：App 跳过 COS 直传，直接 `uni.uploadFile` 后端中转；401 清 token；支持只有 path/size 的临时文件
- 10 个上传入口全部接入（H5 保留原 `<input type=file>`）：
  EditProfile、Feedback、MyAlbum、RealName、Withdraw、report-modal、
  PublishPost（图片/视频）、MyServices（图标）、OnlineApplyForm、OfflineApplyForm

### 2. App 原生通话接入
- `nativeCallAdapter.js`：单例事件总线、权限 Promise、muteVideo/startAudio/switchCamera/speaker
- 新增 `nativeCallService.js`：与浏览器版同接口（initiate/handleIncoming/setCallbacks/hangup/媒体控制），
  通过 socket 现有信令（call_invite/call_accept/webrtc_offer/webrtc_answer/webrtc_ice_candidate）
- `webrtcCallService.js`：App 且 `VITE_USE_NATIVE_CALL=1` 时无感切换到原生实现，H5 逻辑不变
- `callService.js`：补 toggleSpeaker/switchCamera 透传
- `VideoCall.vue`/`AudioCall.vue`：原生模式不绑 MediaStream、隐藏占位层、显示「原生 WebRTC」、视频页增加切换摄像头按钮
- `App.vue` onLaunch 预热插件；UTS 插件补 `muteVideo`，权限只阻断相机/麦克风（通知权限不阻断通话）
- `build:app` 现在会真正编译 UTS 插件（此前插件未被引用，从未参与构建）；新增 devDependency `@dcloudio/uni-uts-v1`

### 3. 旧版迁移缺口补齐（第二轮审计后）

- 主 Tab 左右滑动 + 页面过渡动画（`GlobalUI.vue` + `route.js` + `global.css`）
- 全局错误兜底：`index.html` 内联抑制 + `main.js` errorHandler/window handlers + `useGlobalError` 全局兜底层
- `PageLayout` 用 ErrorBoundary 包住页面内容；通话页 `safeBack` 通过 `router.options` 恢复返回上一页
- PC 样式壳恢复（padding/卡片/按钮/输入框/弹窗限宽）；SkinShop 补 PC 居中；dev 代理补 charset
- 审计报告：原 `automation/GAP-AUDIT-2026-10-20.md`（2026-10-20 归档；结论见 `app/README.md`「迁移完整性」）

### 4. Sealos 部署产物（2026-10-20 02:55）

- `deploy/sealos/README.md`：应用管理 + 托管数据库的完整部署步骤
- `Dockerfile.web`：H5 + 管理后台 + Nginx 单镜像
- `deploy/sealos/nginx.conf.template`、`backend.env.example`、`build-push.ps1`
- 后端镜像内置 `mysql-client`、`scripts/`、`sql/`，便于 Sealos 容器终端初始化
- 早期错误守卫改为 `static/early-error-guard.js`，兼容生产 CSP `script-src 'self'`

### 5. Sealos 生产部署（2026-10-20 04:05）

- 线上：`https://fazwhznenrqo.sealoshzh.site`（H5 / `/admin` / `/api` / `/socket.io`）
- 应用：`kaifa-app-release-wrgqvl`；部署时用的是更早的镜像 tag（已停用），**当前线上 `kaifa-app:v1.0.11`**（2026-10-21，版本演进见下）
- 短信内测：`SMS_TEST_MODE` 白名单回传验证码（13800138001/13900019999），前端自动填入
- 数据库：Sealos 托管 MySQL/Mongo/Redis（内网服务名直连，均已 up）
- 已验证：health、真实用户登录/钱包、管理员登录、图片上传、Socket.IO handshake
- 部署记录：`deploy/sealos/DEPLOYED-2026-10-20.md`
- 版本演进（2026-10-20，来源《上线迁移与核对清单-2026-10-20》§8，该文件已归档；现行记录见 DEPLOYED）：
  - `v1.0.6`：线上实跑第 14~17 步迁移（公告表 `xn_notice`、卡密密码 100 行、实名 5 行、手机号 178 行 + 唯一盲索引）；同时修掉两个真问题——线上镜像 `AUTO_MIGRATE=false` 导致启动迁移被整体跳过、`runMigrations.js` 漏 `await encryptMobileUp()`
  - `v1.0.7`：用户端（`app/dist/build/h5`）与管理端新页面重新发版
  - `v1.0.8`：本批迁移缺口收口重建发版（含 3 处 CSS 未闭合修复）
  - `v1.0.9`：修复 services 桶漏导出 `skinService`（`/api/user/pref`、`/api/user/skins` 由 500 恢复 200）
  - `v1.0.10`：存储默认 auto + 内置 ali-oss/qiniu SDK；**发布失败**（镜像未产出，Pod 拉不到镜像）
  - `v1.0.11`：DevBox 瘦身（733M→256M）后重新发布 v1.0.10 内容，发布成功并切 tag
  - 线上当前版本与逐轮执行记录以 `deploy/sealos/DEPLOYED-2026-10-20.md` 为准

### 6. App 端兜底
- `p2pFetchService.js`：App 端禁用浏览器 DataChannel 取数（回退签名 URL）；peer-online 走统一 request
- ChatRoom / PublishPost 逆地理编码：`fetch` → `uni.request`（App/H5 通用）
- MyServices App 端语音介绍上传未接原生录音，保存时给出明确提示（不静默失败）

## 验证证据

- 单元测试：**25 文件 / 252 用例通过**（新增 mediaPicker、router.options、导航方向、全局错误用例）
- H5 构建：`dist/build/h5`（133 assets，约 1.88 MB）
- 全页面冒烟：**53 页，pageErrors=0，consoleErrors=0**；登录、卡密、钱包、提现 mock 链路通过
- 滑动验证：Playwright 模拟 Home → Square → Home，无 pageerror
- 最近冒烟：`.dsh/trash-2026-10-20T08-33-34-233Z/app/.automation/smoke-20261020-025452.json`（原 `app/.automation/` 已整体归档）
- App 资源构建：`dist/build/app`，manifest 权限 OK，app-service.js≈1.47 MB，
  产物包含 `uni_modules/kaifa-webrtc/.../src/index.kt`（UTS→Kotlin 已生成）
- 自动化：`task:auto` 总体 pass（`automation/run-summary.json`）

## 仍需真机/HBuilderX 验证（代码已就位但本机无法验证）

- HBuilderX 自定义基座编译 Kotlin（CLI 只验证到 UTS→Kotlin 生成）
- 真机权限、双向通话、后台保音、SurfaceView 层级、切换摄像头
- App 选图/上传（uni.uploadFile、临时路径预览）
- App socket 实时事件、来电

## 环境注意

- 本机全局无 `pnpm`，验证使用 `npx pnpm@10.15.0 ...`；`pnpm-workspace.yaml` 删除了与 `onlyBuiltDependencies` 冲突的 `dangerouslyAllowAllBuilds`
- `task-install` 将 `pnpm rebuild` 降级为最佳努力（npx 环境下 postinstall 找不到 node，但在 install 阶段依赖已就绪）
- 自动化脚本会把 node 目录补进子进程 PATH

## 下次继续

```bash
cd app
npx --yes pnpm@10.15.0 task:auto
```

真机阶段先读 `automation/REMAINING-WORK.md`、`PACKAGING.md`、`src/uni_modules/kaifa-webrtc/README.md`。
