# eu搭子用户端（uni-app 迁移版）

由原 `frontend/`（Vue3 + Vite SPA）迁移而来，一套代码同时产出 H5 与 App 资源。

## 常用命令

```bash
pnpm install
pnpm dev:h5          # H5 开发服务器 http://127.0.0.1:5174
pnpm build:h5        # H5 产物 dist/build/h5
pnpm build:app       # App 资源 dist/build/app（HBuilderX 导入）
pnpm task:auto       # 自动化：环境检查→安装→构建→全页面冒烟→App资源→报告
pnpm task:smoke      # 静态预览 + Chrome 全页面矩阵冒烟
pnpm task:report     # 汇总报告
pnpm task:context    # 查看上下文使用量（70% 阈值）
```

## 目录

- `src/pages/`：53 个页面（原 views）
- `src/components/`：公共组件（含 GlobalUI）
- `src/services/`、`src/store/`、`src/common/`：原逻辑迁移
- `src/common/route.js`：uni-app 路由兼容层（替换 vue-router）
- `src/uni_modules/kaifa-webrtc/`：Android WebRTC UTS 插件骨架（未实现）
- `scripts/`：自动化任务脚本
- `automation/`：任务清单、进度、交接、报告
- `DEPLOY-H5.md`：替换 nginx 旧 H5 的说明
- `PACKAGING.md`：HBuilderX Android 打包说明

## 当前边界

- 后端未部署：接口会失败，冒烟只校验真实 JS 错误
- App 通话仍走 H5 浏览器 WebRTC；原生插件只有骨架
- H5 与 App 的差异用 `#ifdef` 或运行时能力判断隔离
