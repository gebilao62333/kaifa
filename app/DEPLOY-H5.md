# H5 上线替换说明（新 uni-app 产物）

当前旧站：`frontend/dist` → nginx `/usr/share/nginx/html`。迁移后改为新产物：

```text
app/dist/build/h5  →  nginx /usr/share/nginx/html
```

## docker-compose 挂载

把 nginx 服务的：

```yaml
- ./frontend/dist:/usr/share/nginx/html:ro
```

改为：

```yaml
- ./app/dist/build/h5:/usr/share/nginx/html:ro
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
