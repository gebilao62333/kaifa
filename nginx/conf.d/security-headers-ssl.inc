# 审计 M-9：443（HTTPS）站点专用安全头 = HSTS + X-XSS-Protection + 通用头。
#
# 与 security-headers.inc 同理：本片段要在 443 的 server 块与每个自带 add_header
# 的 location 里重新 include，否则 HSTS 等头会被子层的 add_header 丢弃。
# 注意 X-Frame-Options 统一为 SAMEORIGIN（原 443 写的是 DENY），
# 与 CSP 的 frame-ancestors 'self' 口径一致——DENY 会连本站同源页面嵌框一起禁掉。
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-XSS-Protection "1; mode=block" always;
include /etc/nginx/conf.d/security-headers.inc;
