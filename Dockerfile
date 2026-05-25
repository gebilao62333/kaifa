FROM node:18-alpine AS builder

WORKDIR /app

# 复制后端依赖文件
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --production=false

# 复制后端代码
COPY backend/ ./

# 清理开发依赖
RUN npm prune --production

FROM node:18-alpine

# 设置时区
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 创建非root用户
RUN addgroup -g 1001 nodejs && \
    adduser -D -u 1001 -G nodejs nodejs

WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

# 创建日志目录
RUN mkdir -p /var/log/duoke && chown -R nodejs:nodejs /app /var/log/duoke

USER nodejs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动服务
CMD ["node", "server.js"]
