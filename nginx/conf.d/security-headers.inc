# 审计 M-9：HTTP 层通用安全响应头（片段，非独立站点配置）。
#
# nginx 的 add_header 继承规则是「全有或全无」：任一上下文（server / location）
# 只要自己写了哪怕一条 add_header，就会丢弃从上层继承来的全部 add_header。
# 因此本片段除了在 nginx.conf 的 http 块里 include 一次作为基线，还必须在每个
# 「自带 add_header 的 location」（如 /uploads/、/admin）里重新 include，
# 否则这些路径上的 nosniff / X-Frame-Options / Referrer-Policy / CSP 会被静默丢弃。
#
# 文件名用 .inc 而非 .conf，避免被 nginx.conf 的 `include conf.d/*.conf` 二次加载。
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
# 审计 I-09：CSP 基线；如前端引入新的外部资源域，需同步放行对应指令
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https:; media-src 'self' blob: https:; font-src 'self' data:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'" always;
