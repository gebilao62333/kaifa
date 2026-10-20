# H5 上线替换说明（新 uni-app 产物）

> **适用边界（2026-10-21 更新）**：旧站 `frontend/` 已删除，`docker-compose.yml` 的 nginx 站点根**已改为** `./app/dist/build/h5`；Sealos 线上走 DevBox 发版镜像（同样用 `app/dist/build/h5`）。本文件保留为产物路径与切换历史说明。

当前站点根：`app/dist/build/h5` → nginx `/usr/share/nginx/html`（旧站产物已删除，备份见 `.e2e-run/legacy-frontend-backup-2026-10-21/dist`）。

```text
app/dist/build/h5  →  nginx /usr/share/nginx/html
```

## docker-compose 挂载（已生效）

`docker-compose.yml` 现为：

```yaml
- ./app/dist/build/h5:/usr/share/nginx/html:ro
```

（2026-10-21 前为 `./frontend/dist:/usr/share/nginx/html:ro`；旧站删除后改此挂载。）
```

## nginx（现有 default.conf 已兼容）

```nginx
location / {
  root /usr/share/nginx/html;
  index index.html;
  try_files $uri $uri/ /index.html;
}
location /api/ { proxy_pass http://eudazi_backend; ... }
location /socket.io/ { proxy_pass http://eudazi_backend; ... Upgrade/Connection ... }
```

注意：

- `history` 模式必须有 `try_files ... /index.html`，否则刷新 404
- 旧路径由 `src/static/legacy-redirect.js` 在入口改写为 `/pages/...`
- 旧站切换前建议并行部署到子域或 `/v2`，对比通过后再切主域
- H5 构建产物里的 `/api` 是相对路径，依赖 nginx 同源反代；App 端用 `VITE_API_ORIGIN`

## 切换检查

1. `cd app && pnpm task:build`
2. 把 `dist/build/h5` 部署到测试路径，跑 `pnpm task:smoke`（静态预览）
3. 浏览器回归：首页/登录（手机号验证码）/广场/聊天/钱包/卡密/通话（H5）
4. 确认旧分享链接 `/post-detail/:id` 能跳到新页面
5. 再切 nginx 主域，保留旧 `frontend/dist` 一个版本用于回滚
