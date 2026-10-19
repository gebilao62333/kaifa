# 代码验收导览（不用通读全部代码）

迁移后的用户端在 `app/`，源码约 134 个文件。验收不需要逐行看，按下面 8 个入口看 + 跑 3 条命令即可。

## 一、先跑命令（最省事）

```bash
cd app
pnpm task:test     # 239 个单测
pnpm task:build    # H5 构建
pnpm task:smoke    # 静态预览 + 53 页冒烟（自动起停）
```

出现 `pass`/`239 passed` 即可；截图在 `.automation/shots/`，报告在 `.automation/smoke-*.json`。

## 二、只看这 8 个文件

| # | 文件 | 看什么 | 为什么关键 |
|---|---|---|---|
| 1 | `package.json` | 第 5 行起的 scripts | 项目所有命令入口（dev/build/test/task） |
| 2 | `src/pages.json` | 53 个 pages 数组 | 页面和路由清单；少一页就是漏迁 |
| 3 | `src/common/route.js` | `buildUrl`(135)/`goLogin`(172)/`router`(214)/`installRouteGuard`(240) | 替换 vue-router；旧链接、登录守卫、参数传递都靠它 |
| 4 | `src/common/common.js` | `resolveRequestUrl`(265)/`uniRequest`(271)/`doRequest`(281)/`request`(376) | 替换 fetch 为 uni.request；App 端接口能不能用看这里 |
| 5 | `src/pages/Login.vue` | 15/36/57 行的表单与按钮，307 行 `handleLogin` | 之前 uni-app 下登录按钮不触发，这里改成了 view + @click |
| 6 | `src/main.js` + `src/App.vue` | 创建 app、Pinia、socket、onPageNotFound | 启动流程和全局生命周期 |
| 7 | `src/components/GlobalUI.vue` | 5 个全局组件 | 底部导航/Toast/来电/网络/开屏是否全局生效 |
| 8 | `scripts/task-auto.mjs` + `automation/tasks.json` | 任务顺序与依赖 | 自动化验收怎么跑、失败会不会中断 |

## 三、结论看这几份文档

- `automation/ACCEPTANCE.md`：本次验收结论
- `automation/STATUS.md`：完成/阻塞总览
- `automation/progress.md`：逐批进度
- `automation/run-summary.json`：最近一次全链路结果
- `automation/page-matrix.md`：53 页逐页状态

## 四、哪些不用看

- `node_modules/`、`dist/`、`.automation/` 日志：构建产物和运行日志
- `frontend/`：旧站，保留用于回滚/对照，本次没改
- `backend/`：本次没改
- `kaifa-*snapshot*`：历史快照，和本次迁移无关

## 五、通过标准

1. `pnpm task:auto` 总体 pass
2. `test` 239 用例通过
3. `smoke` 53 页 + 登录/卡密/钱包/提现，`pageErrors=0`
4. `build:h5`、`build:app` 都有产物

## 六、不用自己判断的边界

- App 原生通话还没实现（只有骨架）
- 后端没部署，真实接口没联调
- 还没用 HBuilderX 打 APK
- H5 还没切 nginx

这四项不是代码验收问题，是环境/后续阶段问题。
