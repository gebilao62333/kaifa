# app 自动化任务（分开执行）

> 2026-10-20 文档整治：正文取自 `app/automation/README.md`（该文件归档，现行手册即本文），并修正其「pnpm 11+」等与实测不符的说法。

任务清单在 `automation/tasks.json`（`scripts/task-auto.mjs:9` 硬依赖该路径，勿移动），每个任务独立进程、独立日志；按依赖顺序执行。

## 命令

本机全局没有 pnpm 时，把 `pnpm` 换成 `npx --yes pnpm@10.15.0`。

```bash
pnpm task:list      # 列出任务和依赖
pnpm task:auto      # 全流程：doctor → install → test → build:h5 → smoke → build:app → report
pnpm task:doctor    # 环境检查
pnpm task:install   # 安装依赖/插件（校验 uni-uts-v1）
pnpm task:test      # 单元测试（vitest）
pnpm task:build     # 只构建 H5
pnpm task:dev       # 只启动 H5 开发服务器
pnpm task:smoke     # 只跑 H5 冒烟
pnpm task:app       # 只构建 App 资源（会编译 UTS 插件）
pnpm task:report    # 只汇总报告
pnpm task:verify    # build + smoke
```

单独跑某个任务：`node scripts/task-auto.mjs --only=smoke-h5`

## 依赖/插件

- Node 22+、pnpm >= 9（本机全局 pnpm 未确证；统一用 `npx --yes pnpm@10.15.0` 最稳）
- uni-app Vue3 CLI、Vue 3.4、Pinia、socket.io-client、sass
- `@dcloudio/uni-uts-v1`：App 构建编译 `uni_modules/kaifa-webrtc` UTS 插件所需
- `playwright-core`（不下载浏览器，使用本机 Chrome/Edge；可用 `CHROME_PATH` 指定）
- 本机 Chrome 或 Edge

## 产物

- `dist/build/h5`：H5 产物
- `dist/build/app`：App 资源（用 HBuilderX 导入后运行/打包），含 UTS→Kotlin 插件源
- `.automation/`：任务日志、截图、冒烟 JSON（已在 `app/.gitignore`）
- `automation/run-summary.json` / `run-summary.md` / `report.md` / `page-matrix.md`：`task:auto` / `task:report` 每次运行重写的快照，不是手工维护文档（建议一并加入忽略列表）

## 说明

- 后端未部署时，接口请求失败属于预期；冒烟只拦截真实 JS 错误和页面崩溃。
- 冒烟会自动启动和关闭**静态服务器**，不残留进程。
- `build-app` 是可选任务：失败不会中断 H5 链路，但会在汇总里标记。
- `install` 里的 `pnpm rebuild` 是最佳努力步骤：npx 调用 pnpm 时 Windows postinstall 可能找不到 node，
  依赖在 install 阶段已就绪，后续 test/build/smoke 会验证。
- 自动化脚本会给子进程补 node 目录到 PATH，避免 npx 环境下生命周期脚本失败。
