# app 自动化任务（分开执行）

任务清单在 `automation/tasks.json`，每个任务独立进程、独立日志；按依赖顺序执行。

## 命令

```bash
pnpm task:list      # 列出任务和依赖
pnpm task:auto      # 全流程：doctor → install → build:h5 → smoke → build:app → report
pnpm task:doctor    # 环境检查
pnpm task:install   # 安装依赖/插件
pnpm task:build     # 只构建 H5
pnpm task:dev       # 只启动 H5 开发服务器
pnpm task:smoke     # 只跑 H5 冒烟
pnpm task:app       # 只构建 App 资源
pnpm task:report    # 只汇总报告
pnpm task:verify    # build + smoke
```

单独跑某个任务：`node scripts/task-auto.mjs --only=smoke-h5`

## 依赖/插件

- Node 22+、pnpm 11+
- uni-app Vue3 CLI、Vue 3.4、Pinia、socket.io-client、sass
- `playwright-core`（不下载浏览器，使用本机 Chrome/Edge；可用 `CHROME_PATH` 指定）
- 本机 Chrome 或 Edge

## 产物

- `dist/build/h5`：H5 产物
- `dist/build/app`：App 资源（用 HBuilderX 导入后运行/打包）
- `.automation/`：任务日志、截图、冒烟 JSON
- `automation/run-summary.json` / `automation/run-summary.md` / `automation/report.md`

## 说明

- 后端未部署时，接口请求失败属于预期；冒烟只拦截真实 JS 错误和页面崩溃。
- 冒烟会自动启动和关闭 dev server，不残留进程。
- `build-app` 是可选任务：失败不会中断 H5 链路，但会在汇总里标记。
