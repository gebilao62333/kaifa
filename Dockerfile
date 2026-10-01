# ============================================
# eu搭子 后端 Dockerfile
# 多阶段构建：builder 安装依赖 → runtime 运行
# ============================================

FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖描述文件（需要 package-lock.json 确保版本一致性）
COPY backend/package*.json ./

# 安装所有依赖（含 devDependencies，用于构建阶段）
RUN npm ci --production=false && npm cache clean --force

# 复制后端源码
COPY backend/ ./

# 清理开发依赖，保留生产依赖
RUN npm prune --production

# ============================================
# 运行阶段
# ============================================
FROM node:18-alpine

# 安装运行时依赖：tzdata（时区）、curl（健康检查）
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm -rf /var/cache/apk/*

# 创建非 root 用户（1001:1001）
RUN addgroup -g 1001 nodejs && \
    adduser -D -u 1001 -G nodejs -s /bin/false nodejs

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/package-lock.json ./
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# 注：数据库迁移脚本位于 src/migrations，已随上方 /app/src 一并复制

# 创建日志目录（可通过 LOGS_PATH 环境变量覆盖，默认 /var/log/eudazi）
ENV LOGS_PATH=/var/log/eudazi
RUN mkdir -p ${LOGS_PATH} && \
    chown -R nodejs:nodejs /app ${LOGS_PATH}

# 创建上传目录
RUN mkdir -p /app/public/uploads && \
    chown nodejs:nodejs /app/public/uploads

USER nodejs

# 应用端口
EXPOSE 3000

# 健康检查（30s 初始等待，每 30s 检查一次）
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -sf http://localhost:3000/api/health || exit 1

# 启动命令（直接 node，不使用 npm start，减少进程层级）
CMD ["node", "server.js"]
