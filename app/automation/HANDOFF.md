# kaifa 用户端 uni-app 迁移 · 交接文档

- 生成时间：2026-10-17T14:17:05.733Z
- 工作目录：`C:\Users\admin\Desktop\kaifa`
- 只改：`app/`；不动 `frontend/`、`backend/`；不提交 git
- 当前会话的目标/提醒是**会话级**的；新开对话后需要按本文重新创建 goal 和 schedule

## 一、当前状态（已完成，2026-10-18 03:53 已暂停）

- `app/`：uni-app Vue3 + Vite CLI 工程，57 个 views 迁到 `src/pages/`
- 路由：52 条写入 `src/pages.json`；`src/common/route.js` 兼容层（push/replace/back/query/params/登录守卫）
- 旧路径兼容：`src/static/legacy-redirect.js`（/login、/post-detail/1 等）
- 全局 UI：`src/components/GlobalUI.vue`（BottomNav/Toast/来电/网络/开屏），挂在 `#app` 外
- 请求层：`src/common/common.js` 已从 fetch 改为 `uni.request`；H5 构建已通过
- App 资源构建：`dist/build/app` 可出；修复了动态 import 导致的 iife 报错
- 自动化任务链：`pnpm task:auto` 曾全绿（doctor/install/build-h5/smoke-h5/build-app/report）
- 冒烟脚本：`scripts/task-smoke.mjs`，7 页矩阵，`pageErrors=0`、`consoleErrors=0`
- 已修：Search 输入框 focus、ChatRoom 静态数据 import、登录守卫跳转 URL
- 产物：`dist/build/h5`、`dist/build/app`；日志/截图 `app/.automation/`

## 二、当前进行中 / 待验证

- 全路由冒烟 51 页已通过（pageErrors=0/consoleErrors=0）；`pages/NotFound` 已补注册
- `uni.request` 已替换；`VITE_API_ORIGIN` 已加（App 打包填域名）
- UTS 插件骨架已建：`src/uni_modules/kaifa-webrtc/`（未实现）


- `uni.request` 改造后只跑了 `build:h5`，**还没重跑 smoke**（上次 smoke 被会话中断）
- 下一步先跑：`node scripts/task-smoke.mjs`，确认 7 页仍 0 错误
- 然后扩到全 52 路由矩阵（公开页 + 登录守卫页 + 动态参数页）

## 三、任务清单（按优先级）

1. 重跑 smoke，确认 uni.request 改造无回归
2. 扩展 `scripts/task-smoke.mjs` 为全路由矩阵，逐页修运行时错误
3. 请求层收尾：`VITE_API_ORIGIN` 给 App 用；uploadService 的 fetch/FormData 后续改 `uni.uploadFile`
4. 存储/socket：H5 可暂用 localStorage/socket.io-client；App 端后续适配
5. UTS 插件骨架：`uni_modules/kaifa-webrtc/utssdk/app-android`（Google WebRTC AAR、权限、前台服务接口），只写代码不做真机验证
6. 每批跑 `pnpm task:auto`，更新本文件/`progress.md`

## 四、自动化命令

```bash
cd app
pnpm task:list
pnpm task:auto
pnpm task:smoke
pnpm task:build
pnpm task:app
pnpm task:report
```

- 任务清单：`automation/tasks.json`
- 进度：`automation/progress.md`
- 汇总：`automation/run-summary.json` / `automation/report.md`
- 日志/截图：`.automation/`

## 五、时间与暂停/关机规则

- 用户离开 10 小时；要求 **2026-10-18 03:57（Asia/Shanghai）暂停所有任务并记录进度**
- 提前完成全部计划任务 → 先写进度，再：
  `node scripts/task-shutdown.mjs --reason=tasks-complete --confirm`
  （60 秒延迟关机；只结束 5174 端口 dev server；标记文件 `automation/allow-shutdown` 必须存在）
- API 余额 < 0.5 元 → 暂停并关机：`scripts/task-cost-check.mjs` 读取 `API_BALANCE_CNY` 或 `automation/api-balance.txt`；**当前没有数据源，需用户提供**，否则守卫不触发
- 03:57 暂停（不关机，除非余额触发）：清理 dev server、写 `progress.md`、暂停 goal、删除成本提醒
- 新对话需要重新创建 goal 和两个提醒（暂停提醒 + 每 30 分钟成本检查）

## 五-2、上下文 70% 规则

- 用户要求：上下文用到 70% 时暂停并新开对话，避免卡住
- 监控：`node scripts/task-context.mjs --threshold=70`（读取 `.dsh` 会话 usage；当前约 38.45% / 1,048,576）
- 每 20 分钟自动检查；达到 70% 时停止新任务、写进度/交接、暂停 goal、删除提醒但不关机
- 新对话直接用本文第七节引导语

## 六、阻塞项（需要用户回来提供）

- 后端未部署：接口/登录/业务数据无法真实联调；H5 代理 `localhost:3000`
- HBuilderX GUI/云打包：只能出 `dist/build/app`，不能出 APK
- 真机：华为 Mate 30 Pro、真我 Neo7 用于通话/权限/后台保活
- DCloud 账号、签名证书、coturn/TRTC 账号
- API 余额查询命令/文件（用于 0.5 元关机守卫）

## 七、新对话引导语（复制粘贴）

> 读取 `C:\Users\admin\Desktop\kaifa\app\automation\HANDOFF.md`，按里面的任务继续自动执行。目标是 2026-10-18 03:57（Asia/Shanghai）之前完成：重跑 smoke、全路由矩阵、uni.request 收尾、运行时修复、App 资源构建、UTS 插件骨架；每批更新 progress.md。到点暂停并记录进度；任务提前完成则执行 `node scripts/task-shutdown.mjs --reason=tasks-complete --confirm` 关机；API 余额数据源见 HANDOFF（没有数据源时不触发余额关机）。只改 app/，不动 frontend/backend。

## 八、当前已知风险

- 上下文已用约 36%，继续 5 小时 50 分有耗尽风险；建议新开对话
- 无后端时接口报错属预期，冒烟会过滤 `RequestError/服务器繁忙` 类错误
- 视频通话/原生 WebRTC 插件尚未实现，App 资源可构建但通话不可用
