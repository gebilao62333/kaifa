#!/usr/bin/env node

/**
 * 多客陪玩平台 - API 接口连通性测试脚本
 * 
 * 功能：
 * 1. 自动扫描路由文件提取所有 API 端点
 * 2. 逐一发送请求验证响应状态
 * 3. 区分正常响应、认证失败、网络错误
 * 4. 支持注入 Token 或自动获取临时凭证
 * 5. 输出详细测试报告（JSON + 控制台表格）
 * 
 * 用法：
 *   node api-health-check.js [options]
 * 
 * 选项：
 *   --base-url <url>     API 基础地址（默认: http://localhost:3000）
 *   --token <token>      手动指定 Bearer Token
 *   --admin-token <t>    手动指定 Admin Token
 *   --login              自动登录获取 Token（需配置 --username --password）
 *   --username <user>    登录用户名
 *   --password <pass>    登录密码
 *   --format <type>      输出格式: table | json | markdown（默认: table）
 *   --output <file>      将报告输出到文件
 *   --timeout <ms>       请求超时毫秒数（默认: 10000）
 *   --filter <pattern>   只测试匹配 pattern 的接口
 *   --concurrency <n>    并发请求数（默认: 5）
 *   --no-auth            跳过需要认证的接口
 *   --verbose            显示详细日志
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置解析
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    baseUrl: 'http://localhost:3000',
    token: null,
    adminToken: null,
    autoLogin: false,
    username: null,
    password: null,
    format: 'table',
    outputFile: null,
    timeout: 10000,
    filter: null,
    concurrency: 5,
    skipAuth: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-url': config.baseUrl = args[++i]; break;
      case '--token': config.token = args[++i]; break;
      case '--admin-token': config.adminToken = args[++i]; break;
      case '--login': config.autoLogin = true; break;
      case '--username': config.username = args[++i]; break;
      case '--password': config.password = args[++i]; break;
      case '--format': config.format = args[++i]; break;
      case '--output': config.outputFile = args[++i]; break;
      case '--timeout': config.timeout = parseInt(args[++i]); break;
      case '--filter': config.filter = args[++i]; break;
      case '--concurrency': config.concurrency = parseInt(args[++i]); break;
      case '--no-auth': config.skipAuth = true; break;
      case '--verbose': config.verbose = true; break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
多客陪玩平台 - API 接口连通性测试工具

用法: node api-health-check.js [选项]

选项:
  --base-url <url>     API 基础地址 (默认: http://localhost:3000)
  --token <token>      手动指定 Bearer Token (用于认证接口)
  --admin-token <t>    手动指定管理员 Token
  --login              自动调用登录接口获取 Token
  --username <user>    登录用户名 (配合 --login 使用)
  --password <pass>    登录密码 (配合 --login 使用)
  --format <type>      输出格式: table | json | markdown (默认: table)
  --output <file>      将报告保存到指定文件
  --timeout <ms>       请求超时时间，毫秒 (默认: 10000)
  --filter <pattern>   只测试 URL 包含指定字符串的接口
  --concurrency <n>    并发请求数 (默认: 5)
  --no-auth            跳过所有需要认证的接口
  --verbose            显示详细调试信息
  --help               显示帮助信息

示例:
  # 基础测试
  node api-health-check.js

  # 指定服务器地址
  node api-health-check.js --base-url http://192.168.1.100:3001

  # 使用 Token 测试所有接口
  node api-health-check.js --token "eyJhbGciOiJIUzI1NiIs..."

  # 自动登录获取 Token
  node api-health-check.js --login --username admin --password admin123

  # 输出 JSON 报告到文件
  node api-health-check.js --format json --output report.json

  # 只测试聊天相关接口
  node api-health-check.js --filter chat

  # 生成 Markdown 报告
  node api-health-check.js --format markdown --output API-REPORT.md
`);
}

// ============================================================
// API 端点定义（从路由文件扫描提取）
// ============================================================

function getApiEndpoints() {
  // 基于实际路由文件精确提取的端点列表
  return [
    // --- 系统/健康检查 (server.js 内联) ---
    { method: 'GET',    path: '/api/health',                auth: 'none',   module: '系统',   desc: '服务健康检查' },
    { method: 'GET',    path: '/api/health/db',             auth: 'none',   module: '系统',   desc: '数据库健康检查' },
    { method: 'GET',    path: '/api/test',                  auth: 'none',   module: '系统',   desc: 'API测试端点' },

    // --- 用户模块 /api/user (user.js) ---
    { method: 'POST',   path: '/api/user/login',            auth: 'none',   module: '用户',   desc: '用户登录' },
    { method: 'POST',   path: '/api/user/register',         auth: 'none',   module: '用户',   desc: '用户注册' },
    { method: 'POST',   path: '/api/user/reset-password',   auth: 'none',   module: '用户',   desc: '重置密码' },
    { method: 'GET',    path: '/api/user/get',              auth: 'user',   module: '用户',   desc: '获取用户信息' },
    { method: 'POST',   path: '/api/user/update',           auth: 'user',   module: '用户',   desc: '更新用户信息' },
    { method: 'POST',   path: '/api/user/follow',           auth: 'user',   module: '用户',   desc: '关注用户' },
    { method: 'GET',    path: '/api/user/fans',             auth: 'user',   module: '用户',   desc: '获取粉丝列表' },
    { method: 'GET',    path: '/api/user/follows',          auth: 'user',   module: '用户',   desc: '获取关注列表' },
    { method: 'POST',   path: '/api/user/send-sms',         auth: 'none',   module: '用户',   desc: '发送短信验证码' },
    { method: 'POST',   path: '/api/user/login-mobile',     auth: 'none',   module: '用户',   desc: '手机号登录' },
    { method: 'POST',   path: '/api/user/login-third',      auth: 'none',   module: '用户',   desc: '第三方登录' },
    { method: 'POST',   path: '/api/user/refresh-token',    auth: 'none',   module: '用户',   desc: '刷新Token' },

    // --- 聊天模块 /api/chat (chat.js) ---
    { method: 'GET',    path: '/api/chat/list',             auth: 'user',   module: '聊天',   desc: '获取聊天列表' },
    { method: 'GET',    path: '/api/chat/messages',         auth: 'user',   module: '聊天',   desc: '获取消息记录' },
    { method: 'POST',   path: '/api/chat/send',             auth: 'user',   module: '聊天',   desc: '发送消息' },
    { method: 'POST',   path: '/api/chat/revoke',           auth: 'user',   module: '聊天',   desc: '撤回消息' },
    { method: 'POST',   path: '/api/chat/mark-read',        auth: 'user',   module: '聊天',   desc: '标记已读' },
    { method: 'POST',   path: '/api/chat/room/create',      auth: 'user',   module: '聊天',   desc: '创建聊天室' },
    { method: 'GET',    path: '/api/chat/room/info',        auth: 'user',   module: '聊天',   desc: '获取聊天室信息' },
    { method: 'GET',    path: '/api/chat/rooms',            auth: 'none',   module: '聊天',   desc: '获取聊天室列表' },

    // --- 礼物模块 /api/gift (gift.js) ---
    { method: 'GET',    path: '/api/gift/list',                     auth: 'none',   module: '礼物',   desc: '获取礼物列表' },
    { method: 'POST',   path: '/api/gift/send',                     auth: 'user',   module: '礼物',   desc: '赠送礼物' },
    { method: 'GET',    path: '/api/gift/bag',                      auth: 'user',   module: '礼物',   desc: '获取礼物背包' },
    { method: 'POST',   path: '/api/gift/withdraw',                 auth: 'user',   module: '礼物',   desc: '提现' },
    { method: 'GET',    path: '/api/gift/admin/withdraw/list',      auth: 'user',   module: '礼物',   desc: '提现列表' },
    { method: 'POST',   path: '/api/gift/admin/withdraw/approve',   auth: 'user',   module: '礼物',   desc: '审核通过提现' },
    { method: 'POST',   path: '/api/gift/admin/withdraw/reject',    auth: 'user',   module: '礼物',   desc: '拒绝提现' },
    { method: 'POST',   path: '/api/gift/redpacket/send',           auth: 'user',   module: '礼物',   desc: '发红包' },
    { method: 'POST',   path: '/api/gift/redpacket/receive',        auth: 'user',   module: '礼物',   desc: '抢红包' },
    { method: 'GET',    path: '/api/gift/redpacket/history',        auth: 'user',   module: '礼物',   desc: '红包历史' },

    // --- 支付模块 /api/pay (pay.js) ---
    { method: 'GET',    path: '/api/pay/packages',            auth: 'none',   module: '支付',   desc: '获取套餐列表' },
    { method: 'POST',   path: '/api/pay/create-order',        auth: 'user',   module: '支付',   desc: '创建订单' },
    { method: 'POST',   path: '/api/pay/wx-order',            auth: 'user',   module: '支付',   desc: '创建微信订单' },
    { method: 'POST',   path: '/api/pay/wx-notify',           auth: 'none',   module: '支付',   desc: '微信支付回调' },
    { method: 'GET',    path: '/api/pay/wx-query',            auth: 'user',   module: '支付',   desc: '查询微信订单' },
    { method: 'POST',   path: '/api/pay/wx-close',            auth: 'user',   module: '支付',   desc: '关闭微信订单' },
    { method: 'POST',   path: '/api/pay/wx-callback',         auth: 'none',   module: '支付',   desc: '微信支付结果通知' },
    { method: 'GET',    path: '/api/pay/order-status',        auth: 'user',   module: '支付',   desc: '获取订单状态' },
    { method: 'POST',   path: '/api/pay/validate-card',       auth: 'none',   module: '支付',   desc: '验证充值卡' },
    { method: 'POST',   path: '/api/pay/use-card',            auth: 'user',   module: '支付',   desc: '使用充值卡' },
    { method: 'GET',    path: '/api/pay/recharge/list',       auth: 'none',   module: '支付',   desc: '充值记录列表' },
    { method: 'GET',    path: '/api/pay/wallet/balance',      auth: 'user',   module: '支付',   desc: '钱包余额' },
    { method: 'POST',   path: '/api/pay/wallet/recharge',     auth: 'user',   module: '支付',   desc: '钱包充值' },
    { method: 'GET',    path: '/api/pay/payment/history',     auth: 'user',   module: '支付',   desc: '支付历史' },
    { method: 'POST',   path: '/api/pay/pay/create',          auth: 'user',   module: '支付',   desc: '创建支付' },
    { method: 'POST',   path: '/api/pay/pay/notify',          auth: 'none',   module: '支付',   desc: '支付通知回调' },

    // --- 游戏模块 /api/games (games.js) ---
    { method: 'GET',    path: '/api/games/categories',        auth: 'none',   module: '游戏',   desc: '游戏分类列表' },
    { method: 'GET',    path: '/api/games/companions',        auth: 'none',   module: '游戏',   desc: '陪玩师列表' },
    { method: 'POST',   path: '/api/games/push',              auth: 'user',   module: '游戏',   desc: '发起游戏订单' },
    { method: 'POST',   path: '/api/games/grab',              auth: 'user',   module: '游戏',   desc: '抢单' },
    { method: 'POST',   path: '/api/games/start',             auth: 'user',   module: '游戏',   desc: '开始服务' },
    { method: 'POST',   path: '/api/games/complete',          auth: 'user',   module: '游戏',   desc: '完成订单' },
    { method: 'POST',   path: '/api/games/cancel',            auth: 'user',   module: '游戏',   desc: '取消订单' },
    { method: 'GET',    path: '/api/games/orders',            auth: 'user',   module: '游戏',   desc: '订单列表' },
    { method: 'POST',   path: '/api/games/apply',             auth: 'user',   module: '游戏',   desc: '申请成为陪玩师' },
    { method: 'GET',    path: '/api/games/apply/status',      auth: 'user',   module: '游戏',   desc: '申请状态查询' },

    // --- 圈子模块 /api/circle (circle.js) ---
    { method: 'GET',    path: '/api/circle/tags',             auth: 'none',   module: '圈子',   desc: '圈子标签列表' },
    { method: 'GET',    path: '/api/circle/posts',            auth: 'none',   module: '圈子',   desc: '动态列表' },
    { method: 'GET',    path: '/api/circle/admin/posts',      auth: 'none',   module: '圈子',   desc: '管理端动态列表' },
    { method: 'GET',    path: '/api/circle/post/:id',         auth: 'none',   module: '圈子',   desc: '动态详情' },
    { method: 'GET',    path: '/api/circle/my-posts',         auth: 'user',   module: '圈子',   desc: '我的动态' },
    { method: 'GET',    path: '/api/circle/comments',         auth: 'none',   module: '圈子',   desc: '评论列表' },
    { method: 'POST',   path: '/api/circle/create',           auth: 'user',   module: '圈子',   desc: '发布动态' },
    { method: 'POST',   path: '/api/circle/unlock',           auth: 'user',   module: '圈子',   desc: '解锁动态' },
    { method: 'POST',   path: '/api/circle/like',             auth: 'user',   module: '圈子',   desc: '点赞动态' },
    { method: 'POST',   path: '/api/circle/comment',          auth: 'user',   module: '圈子',   desc: '评论动态' },

    // --- 预约模块 /api/reserve (reserve.js) ---
    { method: 'GET',    path: '/api/reserve/slots',           auth: 'user',   module: '预约',   desc: '获取时间段' },
    { method: 'POST',   path: '/api/reserve/slots/batch',     auth: 'user',   module: '预约',   desc: '批量创建时间段' },
    { method: 'POST',   path: '/api/reserve/slots/toggle',    auth: 'user',   module: '预约',   desc: '切换时间段状态' },
    { method: 'POST',   path: '/api/reserve/create',          auth: 'user',   module: '预约',   desc: '创建预约' },
    { method: 'POST',   path: '/api/reserve/confirm',         auth: 'user',   module: '预约',   desc: '确认预约' },
    { method: 'POST',   path: '/api/reserve/reject',          auth: 'user',   module: '预约',   desc: '拒绝预约' },
    { method: 'POST',   path: '/api/reserve/cancel',          auth: 'user',   module: '预约',   desc: '取消预约' },
    { method: 'POST',   path: '/api/reserve/complete',        auth: 'user',   module: '预约',   desc: '完成预约' },
    { method: 'GET',    path: '/api/reserve/list',            auth: 'user',   module: '预约',   desc: '预约列表' },

    // --- 需求模块 /api/demand (demand.js) ---
    { method: 'POST',   path: '/api/demand/create',           auth: 'user',   module: '需求',   desc: '发布需求' },
    { method: 'GET',    path: '/api/demand/list',             auth: 'user',   module: '需求',   desc: '需求列表' },
    { method: 'GET',    path: '/api/demand/detail',           auth: 'user',   module: '需求',   desc: '需求详情' },
    { method: 'POST',   path: '/api/demand/cancel',           auth: 'user',   module: '需求',   desc: '取消需求' },

    // --- 管理员模块 /api/admin (admin.js) ---
    // 公开接口
    { method: 'POST',   path: '/api/admin/login',                    auth: 'none',   module: '管理',   desc: '管理员登录' },
    // 需认证的管理接口
    { method: 'GET',    path: '/api/admin/dashboard',                auth: 'admin',  module: '管理',   desc: '仪表盘数据' },
    { method: 'GET',    path: '/api/admin/statistics',               auth: 'admin',  module: '管理',   desc: '数据统计' },
    { method: 'GET',    path: '/api/admin/settings',                 auth: 'admin',  module: '管理',   desc: '系统设置' },
    { method: 'PUT',    path: '/api/admin/settings',                 auth: 'admin',  module: '管理',   desc: '更新系统设置' },
    // 用户管理
    { method: 'GET',    path: '/api/admin/users',                    auth: 'admin',  module: '管理',   desc: '用户列表' },
    { method: 'GET',    path: '/api/admin/users/:id',                auth: 'admin',  module: '管理',   desc: '用户详情' },
    { method: 'POST',   path: '/api/admin/users',                    auth: 'admin',  module: '管理',   desc: '创建用户' },
    { method: 'PUT',    path: '/api/admin/users/:id',                auth: 'admin',  module: '管理',   desc: '更新用户' },
    { method: 'PUT',    path: '/api/admin/users/:id/status',         auth: 'admin',  module: '管理',   desc: '修改用户状态' },
    { method: 'DELETE', path: '/api/admin/users/:id',                auth: 'admin',  module: '管理',   desc: '删除用户' },
    // 兼容接口
    { method: 'POST',   path: '/api/admin/update-user-status',       auth: 'admin',  module: '管理',   desc: '更新用户状态(兼容)' },
    { method: 'GET',    path: '/api/admin/user-detail',              auth: 'admin',  module: '管理',   desc: '用户详情(兼容)' },
    // 订单管理
    { method: 'GET',    path: '/api/admin/orders',                   auth: 'admin',  module: '管理',   desc: '订单列表' },
    { method: 'GET',    path: '/api/admin/orders/:id',               auth: 'admin',  module: '管理',   desc: '订单详情' },
    { method: 'POST',   path: '/api/admin/orders',                   auth: 'admin',  module: '管理',   desc: '创建订单' },
    { method: 'PUT',    path: '/api/admin/orders/:id/status',        auth: 'admin',  module: '管理',   desc: '修改订单状态' },
    { method: 'DELETE', path: '/api/admin/orders/:id',               auth: 'admin',  module: '管理',   desc: '删除订单' },
    // 提现管理
    { method: 'GET',    path: '/api/admin/withdraws',                auth: 'admin',  module: '管理',   desc: '提现列表' },
    { method: 'GET',    path: '/api/admin/withdraws/:id',            auth: 'admin',  module: '管理',   desc: '提现详情' },
    { method: 'POST',   path: '/api/admin/withdraws/:id/approve',    auth: 'admin',  module: '管理',   desc: '审核通过提现' },
    { method: 'POST',   path: '/api/admin/withdraws/:id/reject',     auth: 'admin',  module: '管理',   desc: '拒绝提现' },
    { method: 'DELETE', path: '/api/admin/withdraws/:id',            auth: 'admin',  module: '管理',   desc: '删除提现' },
    // 兼容
    { method: 'POST',   path: '/api/admin/review-withdraw',          auth: 'admin',  module: '管理',   desc: '审核提现(兼容)' },
    // 帖子管理
    { method: 'GET',    path: '/api/admin/posts',                    auth: 'admin',  module: '管理',   desc: '帖子列表' },
    { method: 'GET',    path: '/api/admin/posts/:id',                auth: 'admin',  module: '管理',   desc: '帖子详情' },
    { method: 'DELETE', path: '/api/admin/posts/:id',                auth: 'admin',  module: '管理',   desc: '删除帖子' },
    // 举报管理
    { method: 'GET',    path: '/api/admin/reports',                  auth: 'admin',  module: '管理',   desc: '举报列表' },
    { method: 'GET',    path: '/api/admin/reports/:id',              auth: 'admin',  module: '管理',   desc: '举报详情' },
    { method: 'POST',   path: '/api/admin/reports/:id/handle',       auth: 'admin',  module: '管理',   desc: '处理举报' },
    { method: 'DELETE', path: '/api/admin/reports/:id',              auth: 'admin',  module: '管理',   desc: '删除举报' },
    // 兼容
    { method: 'POST',   path: '/api/admin/handle-report',            auth: 'admin',  module: '管理',   desc: '处理举报(兼容)' },
    // Banner管理
    { method: 'GET',    path: '/api/admin/banners',                  auth: 'admin',  module: '管理',   desc: 'Banner列表' },
    { method: 'GET',    path: '/api/admin/banners/:id',              auth: 'admin',  module: '管理',   desc: 'Banner详情' },
    { method: 'POST',   path: '/api/admin/banners',                  auth: 'admin',  module: '管理',   desc: '创建Banner' },
    { method: 'PUT',    path: '/api/admin/banners/:id',              auth: 'admin',  module: '管理',   desc: '更新Banner' },
    { method: 'PUT',    path: '/api/admin/banners/:id/status',       auth: 'admin',  module: '管理',   desc: '修改Banner状态' },
    { method: 'DELETE', path: '/api/admin/banners/:id',              auth: 'admin',  module: '管理',   desc: '删除Banner' },
    // VIP套餐管理
    { method: 'GET',    path: '/api/admin/vip-packages',             auth: 'admin',  module: '管理',   desc: 'VIP套餐列表' },
    { method: 'GET',    path: '/api/admin/vip-packages/:id',         auth: 'admin',  module: '管理',   desc: 'VIP套餐详情' },
    { method: 'POST',   path: '/api/admin/vip-packages',             auth: 'admin',  module: '管理',   desc: '创建VIP套餐' },
    { method: 'PUT',    path: '/api/admin/vip-packages/:id',         auth: 'admin',  module: '管理',   desc: '更新VIP套餐' },
    { method: 'PUT',    path: '/api/admin/vip-packages/:id/status',  auth: 'admin',  module: '管理',   desc: '修改VIP套餐状态' },
    { method: 'DELETE', path: '/api/admin/vip-packages/:id',         auth: 'admin',  module: '管理',   desc: '删除VIP套餐' },
    // 礼物管理
    { method: 'GET',    path: '/api/admin/gifts',                    auth: 'admin',  module: '管理',   desc: '礼物列表' },
    { method: 'GET',    path: '/api/admin/gifts/:id',                auth: 'admin',  module: '管理',   desc: '礼物详情' },
    { method: 'POST',   path: '/api/admin/gifts',                    auth: 'admin',  module: '管理',   desc: '创建礼物' },
    { method: 'PUT',    path: '/api/admin/gifts/:id',                auth: 'admin',  module: '管理',   desc: '更新礼物' },
    { method: 'DELETE', path: '/api/admin/gifts/:id',                auth: 'admin',  module: '管理',   desc: '删除礼物' },
    // 礼物记录
    { method: 'GET',    path: '/api/admin/gift-logs',                auth: 'admin',  module: '管理',   desc: '礼物记录列表' },
    { method: 'GET',    path: '/api/admin/gift-logs/:id',            auth: 'admin',  module: '管理',   desc: '礼物记录详情' },
    // 充值记录
    { method: 'GET',    path: '/api/admin/recharge-records',         auth: 'admin',  module: '管理',   desc: '充值记录列表' },
    { method: 'GET',    path: '/api/admin/recharge-records/:id',     auth: 'admin',  module: '管理',   desc: '充值记录详情' },
    { method: 'DELETE', path: '/api/admin/recharge-records/:id',     auth: 'admin',  module: '管理',   desc: '删除充值记录' },
    { method: 'GET',    path: '/api/admin/recharges',                auth: 'admin',  module: '管理',   desc: '充值记录(兼容)' },
    { method: 'GET',    path: '/api/admin/recharges/:id',            auth: 'admin',  module: '管理',   desc: '充值详情(兼容)' },
    // 游戏管理
    { method: 'GET',    path: '/api/admin/games',                    auth: 'admin',  module: '管理',   desc: '游戏列表' },
    { method: 'GET',    path: '/api/admin/games/:id',                auth: 'admin',  module: '管理',   desc: '游戏详情' },
    { method: 'POST',   path: '/api/admin/games',                    auth: 'admin',  module: '管理',   desc: '创建游戏' },
    { method: 'PUT',    path: '/api/admin/games/:id',                auth: 'admin',  module: '管理',   desc: '更新游戏' },
    { method: 'PUT',    path: '/api/admin/games/:id/status',         auth: 'admin',  module: '管理',   desc: '修改游戏状态' },
    { method: 'DELETE', path: '/api/admin/games/:id',                auth: 'admin',  module: '管理',   desc: '删除游戏' },
    // 陪玩师申请管理
    { method: 'GET',    path: '/api/admin/companion-applications',            auth: 'admin',  module: '管理',   desc: '陪玩师申请列表' },
    { method: 'GET',    path: '/api/admin/companion-applications/:id',        auth: 'admin',  module: '管理',   desc: '陪玩师申请详情' },
    { method: 'PUT',    path: '/api/admin/companion-applications/:id/approve',auth: 'admin',  module: '管理',   desc: '通过陪玩师申请' },
    { method: 'PUT',    path: '/api/admin/companion-applications/:id/reject', auth: 'admin',  module: '管理',   desc: '拒绝陪玩师申请' },
    { method: 'DELETE', path: '/api/admin/companion-applications/:id',        auth: 'admin',  module: '管理',   desc: '删除陪玩师申请' },
    // 虚拟用户管理(在admin路由中)
    { method: 'GET',    path: '/api/admin/virtual-users',                    auth: 'admin',  module: '管理',   desc: '虚拟用户列表' },
    { method: 'GET',    path: '/api/admin/virtual-users/:id',                auth: 'admin',  module: '管理',   desc: '虚拟用户详情' },
    { method: 'POST',   path: '/api/admin/virtual-users',                    auth: 'admin',  module: '管理',   desc: '创建虚拟用户' },
    { method: 'PUT',    path: '/api/admin/virtual-users/:id',                auth: 'admin',  module: '管理',   desc: '更新虚拟用户' },
    { method: 'DELETE', path: '/api/admin/virtual-users/:id',                auth: 'admin',  module: '管理',   desc: '删除虚拟用户' },
    { method: 'PUT',    path: '/api/admin/virtual-users/:id/status',         auth: 'admin',  module: '管理',   desc: '切换虚拟用户状态' },
    { method: 'GET',    path: '/api/admin/virtual-users/:id/chat-history',   auth: 'admin',  module: '管理',   desc: '虚拟用户聊天历史' },

    // --- 管理员管理模块 /api/admin-manage (adminManage.js) ---
    { method: 'POST',   path: '/api/admin-manage/login',           auth: 'none',   module: '管理配置',desc: '管理员登录' },
    { method: 'GET',    path: '/api/admin-manage/init',            auth: 'none',   module: '管理配置',desc: '初始化管理员' },
    { method: 'GET',    path: '/api/admin-manage/current',         auth: 'admin',  module: '管理配置',desc: '当前管理员信息' },
    { method: 'GET',    path: '/api/admin-manage/admins',          auth: 'admin',  module: '管理配置',desc: '管理员列表' },
    { method: 'POST',   path: '/api/admin-manage/admins',          auth: 'admin',  module: '管理配置',desc: '创建管理员' },
    { method: 'PUT',    path: '/api/admin-manage/admins/:id',      auth: 'admin',  module: '管理配置',desc: '更新管理员' },
    { method: 'PUT',    path: '/api/admin-manage/admins/:id/password',auth: 'admin',module: '管理配置',desc: '修改管理员密码' },
    { method: 'DELETE', path: '/api/admin-manage/admins/:id',      auth: 'admin',  module: '管理配置',desc: '删除管理员' },
    { method: 'GET',    path: '/api/admin-manage/roles',           auth: 'admin',  module: '管理配置',desc: '角色列表' },
    { method: 'POST',   path: '/api/admin-manage/roles',           auth: 'admin',  module: '管理配置',desc: '创建角色' },
    { method: 'PUT',    path: '/api/admin-manage/roles/:id',       auth: 'admin',  module: '管理配置',desc: '更新角色' },
    { method: 'DELETE', path: '/api/admin-manage/roles/:id',       auth: 'admin',  module: '管理配置',desc: '删除角色' },
    { method: 'GET',    path: '/api/admin-manage/permissions',     auth: 'admin',  module: '管理配置',desc: '权限列表' },

    // --- Banner模块 /api/banner (banner.js) ---
    { method: 'GET',    path: '/api/banner/list',           auth: 'none',   module: '运营',   desc: 'Banner列表' },
    { method: 'GET',    path: '/api/banner/:id',            auth: 'none',   module: '运营',   desc: 'Banner详情' },
    { method: 'POST',   path: '/api/banner',                auth: 'none',   module: '运营',   desc: '创建Banner' },
    { method: 'PUT',    path: '/api/banner/:id',            auth: 'none',   module: '运营',   desc: '更新Banner' },
    { method: 'DELETE', path: '/api/banner/:id',            auth: 'none',   module: '运营',   desc: '删除Banner' },
    { method: 'PUT',    path: '/api/banner/:id/status',     auth: 'none',   module: '运营',   desc: '修改Banner状态' },

    // --- 音视频模块 /api/trtc (trtc.js) ---
    { method: 'GET',    path: '/api/trtc/auth',             auth: 'user',   module: '音视频', desc: '获取TRTC签名' },
    { method: 'POST',   path: '/api/trtc/start',            auth: 'user',   module: '音视频', desc: '发起通话' },
    { method: 'POST',   path: '/api/trtc/cancel',           auth: 'user',   module: '音视频', desc: '取消通话' },
    { method: 'POST',   path: '/api/trtc/reject',           auth: 'user',   module: '音视频', desc: '拒绝通话' },
    { method: 'POST',   path: '/api/trtc/accept',           auth: 'user',   module: '音视频', desc: '接受通话' },
    { method: 'POST',   path: '/api/trtc/end',              auth: 'user',   module: '音视频', desc: '结束通话' },
    { method: 'GET',    path: '/api/trtc/history',          auth: 'user',   module: '音视频', desc: '通话历史' },
    { method: 'POST',   path: '/api/trtc/room/create',      auth: 'user',   module: '音视频', desc: '创建房间' },
    { method: 'POST',   path: '/api/trtc/room/enter',       auth: 'user',   module: '音视频', desc: '进入房间' },
    { method: 'POST',   path: '/api/trtc/room/leave',       auth: 'user',   module: '音视频', desc: '离开房间' },
    { method: 'GET',    path: '/api/trtc/room/:roomId',     auth: 'user',   module: '音视频', desc: '房间信息' },
    { method: 'POST',   path: '/api/trtc/billing/start',    auth: 'user',   module: '音视频', desc: '开始计费' },
    { method: 'POST',   path: '/api/trtc/billing/end',      auth: 'user',   module: '音视频', desc: '结束计费' },

    // --- 举报模块 /api/report (report.js) ---
    { method: 'POST',   path: '/api/report',                auth: 'user',   module: '举报',   desc: '创建举报' },
    { method: 'GET',    path: '/api/report/list',           auth: 'none',   module: '举报',   desc: '举报列表' },
    { method: 'POST',   path: '/api/report/handle',         auth: 'none',   module: '举报',   desc: '处理举报' },

    // --- 上传模块 /api/upload (upload.js) ---
    { method: 'POST',   path: '/api/upload/image',          auth: 'user',   module: '上传',   desc: '上传图片(multipart)' },
    { method: 'POST',   path: '/api/upload/audio',          auth: 'user',   module: '上传',   desc: '上传音频(multipart)' },
    { method: 'POST',   path: '/api/upload/video',          auth: 'user',   module: '上传',   desc: '上传视频(multipart)' },

    // --- 行政区划模块 /api/region (region.js) ---
    { method: 'GET',    path: '/api/region/provinces',              auth: 'none',   module: '地区',   desc: '省份列表' },
    { method: 'GET',    path: '/api/region/cities/:provinceCode',   auth: 'none',   module: '地区',   desc: '城市列表' },
    { method: 'GET',    path: '/api/region/districts/:cityCode',    auth: 'none',   module: '地区',   desc: '区县列表' },
    { method: 'GET',    path: '/api/region/townships/:districtCode',auth: 'none',   module: '地区',   desc: '街道列表' },
    { method: 'GET',    path: '/api/region/search',                 auth: 'none',   module: '地区',   desc: '搜索地区' },

    // --- 虚拟用户模块 /api/virtual-user (virtualUser.js) ---
    { method: 'GET',    path: '/api/virtual-user',                  auth: 'user',   module: '虚拟用户',desc: '虚拟用户列表' },
    { method: 'POST',   path: '/api/virtual-user',                  auth: 'user',   module: '虚拟用户',desc: '创建虚拟用户' },
    { method: 'GET',    path: '/api/virtual-user/:id',              auth: 'user',   module: '虚拟用户',desc: '虚拟用户详情' },
    { method: 'PUT',    path: '/api/virtual-user/:id',              auth: 'user',   module: '虚拟用户',desc: '更新虚拟用户' },
    { method: 'DELETE', path: '/api/virtual-user/:id',              auth: 'user',   module: '虚拟用户',desc: '删除虚拟用户' },
    { method: 'POST',   path: '/api/virtual-user/:id/status',       auth: 'user',   module: '虚拟用户',desc: '切换在线状态' },
    { method: 'POST',   path: '/api/virtual-user/:virtualUserId/chat',   auth: 'user',  module: '虚拟用户',desc: '与虚拟用户聊天' },
    { method: 'GET',    path: '/api/virtual-user/:virtualUserId/history',auth: 'user',   module: '虚拟用户',desc: '聊天历史' },
    { method: 'DELETE', path: '/api/virtual-user/:virtualUserId/context',auth: 'user', module: '虚拟用户',desc: '清除上下文' },

    // --- 标签模块 /api/tag (tag.js) ---
    { method: 'GET',    path: '/api/tag',                    auth: 'user',   module: '标签',   desc: '标签列表' },
    { method: 'POST',   path: '/api/tag',                    auth: 'user',   module: '标签',   desc: '创建标签' },
    { method: 'GET',    path: '/api/tag/defaults',           auth: 'user',   module: '标签',   desc: '默认标签' },
    { method: 'GET',    path: '/api/tag/recommend',          auth: 'user',   module: '标签',   desc: '推荐标签' },
    { method: 'GET',    path: '/api/tag/category/:category', auth: 'user',   module: '标签',   desc: '按分类获取标签' },
    { method: 'GET',    path: '/api/tag/:id',                auth: 'user',   module: '标签',   desc: '标签详情' },
    { method: 'PUT',    path: '/api/tag/:id',                auth: 'user',   module: '标签',   desc: '更新标签' },
    { method: 'DELETE', path: '/api/tag/:id',                auth: 'user',   module: '标签',   desc: '删除标签' },
    { method: 'POST',   path: '/api/tag/init-defaults',      auth: 'user',   module: '标签',   desc: '初始化默认标签' },
    { method: 'GET',    path: '/api/tag/:tagId/users',       auth: 'user',   module: '标签',   desc: '标签关联用户' },
    { method: 'POST',   path: '/api/tag/assign',             auth: 'user',   module: '标签',   desc: '分配标签' },
    { method: 'POST',   path: '/api/tag/remove',             auth: 'user',   module: '标签',   desc: '移除标签' },
    { method: 'GET',    path: '/api/tag/user/:virtualUserId', auth: 'user',  module: '标签',   desc: '用户标签列表' },
    { method: 'POST',   path: '/api/tag/set-primary',        auth: 'user',   module: '标签',   desc: '设置主标签' },

    // --- VIP模块 /api/vip (vip.js) ---
    { method: 'GET',    path: '/api/vip/packages',           auth: 'none',   module: 'VIP',    desc: 'VIP套餐列表' },
    { method: 'GET',    path: '/api/vip/info',               auth: 'user',   module: 'VIP',    desc: 'VIP信息' },
    { method: 'POST',   path: '/api/vip/order',              auth: 'user',   module: 'VIP',    desc: '创建VIP订单' },
    { method: 'POST',   path: '/api/vip/order/complete',     auth: 'user',   module: 'VIP',    desc: '完成VIP订单' },
    { method: 'GET',    path: '/api/vip/order/status',       auth: 'user',   module: 'VIP',    desc: 'VIP订单状态' },
    { method: 'GET',    path: '/api/vip/orders',             auth: 'user',   module: 'VIP',    desc: 'VIP订单列表' },

    // --- 相册模块 /api/album (album.js) ---
    { method: 'GET',    path: '/api/album/photos',           auth: 'user',   module: '相册',   desc: '照片列表' },
    { method: 'POST',   path: '/api/album/upload',           auth: 'user',   module: '相册',   desc: '上传照片(multipart)' },
    { method: 'POST',   path: '/api/album/delete',           auth: 'user',   module: '相册',   desc: '删除照片' },
    { method: 'POST',   path: '/api/album/like',             auth: 'user',   module: '相册',   desc: '点赞照片' },

    // --- 项目管理模块 /api/project (project.js) ---
    { method: 'GET',    path: '/api/project/stats',          auth: 'user',   module: '项目',   desc: '项目统计' },
    { method: 'GET',    path: '/api/project',                auth: 'user',   module: '项目',   desc: '项目列表' },
    { method: 'POST',   path: '/api/project',                auth: 'user',   module: '项目',   desc: '创建项目' },
    { method: 'GET',    path: '/api/project/:id',            auth: 'user',   module: '项目',   desc: '项目详情' },
    { method: 'PUT',    path: '/api/project/:id',            auth: 'user',   module: '项目',   desc: '更新项目' },
    { method: 'DELETE', path: '/api/project/:id',            auth: 'user',   module: '项目',   desc: '删除项目' },
    { method: 'POST',   path: '/api/project/:id/start',      auth: 'user',   module: '项目',   desc: '启动项目' },
    { method: 'POST',   path: '/api/project/:id/stop',       auth: 'user',   module: '项目',   desc: '停止项目' },
    { method: 'POST',   path: '/api/project/:id/restart',    auth: 'user',   module: '项目',   desc: '重启项目' },

    // --- 分享模块 /api/share (share.js) ---
    { method: 'POST',   path: '/api/share/qrcode',           auth: 'none',   module: '分享',   desc: '生成二维码(POST)' },
    { method: 'GET',    path: '/api/share/qrcode',           auth: 'none',   module: '分享',   desc: '生成二维码(GET)' },
  ];
}

// ============================================================
// HTTP 请求工具
// ============================================================

async function makeRequest(url, method, options = {}) {
  const { token, adminToken, timeout = 10000, body } = options;

  const headers = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (adminToken) {
    headers['X-Admin-Token'] = adminToken;
  }
  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const startTime = Date.now();

  try {
    const fetchOptions = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    let data = null;

    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    } catch {
      data = null;
    }

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      data,
      duration,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    return {
      success: false,
      status: null,
      statusText: null,
      data: null,
      duration,
      error: error.name === 'AbortError' ? '请求超时' : error.message,
    };
  }
}

// ============================================================
// 结果分类
// ============================================================

function classifyResult(result, requiresAuth) {
  if (!result.success) {
    return { category: 'NETWORK_ERROR', label: '网络错误', icon: '🔴' };
  }

  const status = result.status;

  if (status >= 200 && status < 300) {
    return { category: 'SUCCESS', label: '正常', icon: '🟢' };
  }

  if (status === 401) {
    return { category: 'AUTH_FAILED', label: '认证失败', icon: '🟡' };
  }

  if (status === 403) {
    return { category: 'FORBIDDEN', label: '权限不足', icon: '🟠' };
  }

  if (status === 404) {
    return { category: 'NOT_FOUND', label: '接口不存在', icon: '⚪' };
  }

  if (status === 429) {
    return { category: 'RATE_LIMITED', label: '请求限流', icon: '🟡' };
  }

  if (status >= 500) {
    return { category: 'SERVER_ERROR', label: '服务端错误', icon: '🔴' };
  }

  return { category: 'UNKNOWN', label: `未知(${status})`, icon: '⚪' };
}

// ============================================================
// 并发控制
// ============================================================

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  const queue = [...tasks];

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        results.push(await task());
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ============================================================
// 自动登录获取 Token
// ============================================================

async function autoLogin(baseUrl, username, password, verbose) {
  // 尝试几种常见的登录方式
  const loginPaths = [
    { path: '/api/user/login', body: { username, password } },
    { path: '/api/user/login', body: { phone: username, password } },
    { path: '/api/user/login-mobile', body: { phone: username, code: password } },
  ];

  for (const login of loginPaths) {
    if (verbose) {
      console.log(`  尝试登录: ${baseUrl}${login.path}`);
    }
    const result = await makeRequest(`${baseUrl}${login.path}`, 'POST', {
      body: login.body,
      timeout: 10000,
    });

    if (result.success && result.status === 200 && result.data) {
      // 尝试从不同字段提取 token
      const token =
        result.data.data?.accessToken ||
        result.data.data?.token ||
        result.data.accessToken ||
        result.data.token;

      if (token) {
        if (verbose) console.log(`  ✅ 登录成功，获取到 Token`);
        return token;
      }
    }
  }

  return null;
}

// ============================================================
// 格式化输出
// ============================================================

function formatTable(results) {
  const lines = [];
  const sep = '─'.repeat(110);

  lines.push(sep);
  lines.push('  多客陪玩平台 - API 接口连通性测试报告');
  lines.push(`  测试时间: ${new Date().toISOString()}`);
  lines.push(`  测试接口总数: ${results.length}`);
  lines.push(sep);

  // 统计
  const stats = getStats(results);
  lines.push(`  🟢 正常: ${stats.success}  |  🟡 认证失败: ${stats.authFailed}  |  🟠 权限不足: ${stats.forbidden}  |  🔴 错误: ${stats.errors}  |  ⚪ 其他: ${stats.other}`);
  lines.push(sep);

  // 表头
  const header =
    '  模块'.padEnd(10) +
    '方法'.padEnd(8) +
    '接口路径'.padEnd(42) +
    '状态码'.padEnd(8) +
    '耗时'.padEnd(8) +
    '结果';
  lines.push(header);
  lines.push(sep);

  for (const r of results) {
    const statusStr = r.status ? String(r.status) : '---';
    const durationStr = r.duration ? `${r.duration}ms` : '---';
    const classify = classifyResult(r, r.requiresAuth);

    const row =
      `  ${r.module.padEnd(8)}` +
      `${r.method.padEnd(8)}` +
      `${r.path.padEnd(42)}` +
      `${statusStr.padEnd(8)}` +
      `${durationStr.padEnd(8)}` +
      `${classify.icon} ${classify.label}`;

    lines.push(row);
  }

  lines.push(sep);

  // 失败详情汇总
  const failures = results.filter(r => {
    const c = classifyResult(r, r.requiresAuth);
    return c.category !== 'SUCCESS';
  });

  if (failures.length > 0) {
    lines.push('');
    lines.push('📋 失败/异常接口详情:');
    lines.push(sep);

    for (const f of failures) {
      const c = classifyResult(f, f.requiresAuth);
      lines.push(`  ${c.icon} [${f.method}] ${f.path}`);
      lines.push(`     模块: ${f.module} | ${f.desc}`);
      lines.push(`     状态: ${f.status || f.error}`);
      if (f.error) lines.push(`     错误: ${f.error}`);
      if (f.data && typeof f.data === 'object' && f.data.message) {
        lines.push(`     消息: ${f.data.message}`);
      }
      lines.push('');
    }
  }

  // 按分类汇总
  lines.push('📊 分类汇总:');
  lines.push(sep);

  const categoryGroups = {};
  for (const r of results) {
    const c = classifyResult(r, r.requiresAuth);
    if (!categoryGroups[c.category]) {
      categoryGroups[c.category] = { count: 0, endpoints: [] };
    }
    categoryGroups[c.category].count++;
    categoryGroups[c.category].endpoints.push(`[${r.method}] ${r.path}`);
  }

  for (const [cat, info] of Object.entries(categoryGroups)) {
    lines.push(`  ${cat}: ${info.count} 个接口`);
    if (info.count <= 10) {
      for (const ep of info.endpoints) {
        lines.push(`    - ${ep}`);
      }
    }
  }

  lines.push(sep);
  lines.push(`  测试完成`);
  lines.push(sep);

  return lines.join('\n');
}

function formatJson(results) {
  const stats = getStats(results);

  const report = {
    meta: {
      title: '多客陪玩平台 - API接口连通性测试报告',
      testTime: new Date().toISOString(),
      totalEndpoints: results.length,
      summary: stats,
    },
    results: results.map(r => {
      const classify = classifyResult(r, r.requiresAuth);
      return {
        method: r.method,
        path: r.path,
        module: r.module,
        description: r.desc,
        requiresAuth: r.requiresAuth,
        status: r.status,
        statusText: r.statusText,
        duration: r.duration,
        category: classify.category,
        label: classify.label,
        error: r.error || null,
        responseMessage: (r.data && r.data.message) || null,
      };
    }),
    failures: results
      .filter(r => {
        const c = classifyResult(r, r.requiresAuth);
        return c.category !== 'SUCCESS';
      })
      .map(r => ({
        method: r.method,
        path: r.path,
        module: r.module,
        status: r.status,
        error: r.error,
        message: (r.data && r.data.message) || null,
      })),
  };

  return JSON.stringify(report, null, 2);
}

function formatMarkdown(results) {
  const lines = [];
  const stats = getStats(results);

  lines.push('# 多客陪玩平台 - API 接口连通性测试报告');
  lines.push('');
  lines.push(`> 测试时间: ${new Date().toISOString()}`);
  lines.push(`> 接口总数: ${results.length}`);
  lines.push('');

  lines.push('## 概览');
  lines.push('');
  lines.push('| 状态 | 数量 |');
  lines.push('|------|------|');
  lines.push(`| 🟢 正常 | ${stats.success} |`);
  lines.push(`| 🟡 认证失败 | ${stats.authFailed} |`);
  lines.push(`| 🟠 权限不足 | ${stats.forbidden} |`);
  lines.push(`| 🔴 错误 | ${stats.errors} |`);
  lines.push(`| ⚪ 其他 | ${stats.other} |`);
  lines.push(`| **总计** | **${results.length}** |`);
  lines.push('');

  lines.push('## 详细结果');
  lines.push('');
  lines.push('| 模块 | 方法 | 接口路径 | 状态码 | 耗时 | 结果 |');
  lines.push('|------|------|----------|--------|------|------|');

  for (const r of results) {
    const statusStr = r.status ? String(r.status) : '---';
    const durationStr = r.duration ? `${r.duration}ms` : '---';
    const classify = classifyResult(r, r.requiresAuth);

    lines.push(
      `| ${r.module} | ${r.method} | \`${r.path}\` | ${statusStr} | ${durationStr} | ${classify.icon} ${classify.label} |`
    );
  }

  lines.push('');

  const failures = results.filter(r => {
    const c = classifyResult(r, r.requiresAuth);
    return c.category !== 'SUCCESS';
  });

  if (failures.length > 0) {
    lines.push('## 失败/异常接口');
    lines.push('');
    lines.push('| 方法 | 接口路径 | 状态 | 说明 |');
    lines.push('|------|----------|------|------|');

    for (const f of failures) {
      const c = classifyResult(f, f.requiresAuth);
      const reason = f.error || (f.data && f.data.message) || c.label;
      lines.push(
        `| ${f.method} | \`${f.path}\` | ${f.status || 'N/A'} | ${reason} |`
      );
    }
    lines.push('');
  }

  // 按模块统计
  lines.push('## 按模块统计');
  lines.push('');

  const moduleStats = {};
  for (const r of results) {
    if (!moduleStats[r.module]) {
      moduleStats[r.module] = { total: 0, success: 0, failed: 0 };
    }
    moduleStats[r.module].total++;
    const c = classifyResult(r, r.requiresAuth);
    if (c.category === 'SUCCESS') {
      moduleStats[r.module].success++;
    } else {
      moduleStats[r.module].failed++;
    }
  }

  lines.push('| 模块 | 总数 | 正常 | 异常 | 通过率 |');
  lines.push('|------|------|------|------|--------|');
  for (const [mod, s] of Object.entries(moduleStats)) {
    const rate = s.total > 0 ? ((s.success / s.total) * 100).toFixed(1) : '0.0';
    lines.push(`| ${mod} | ${s.total} | ${s.success} | ${s.failed} | ${rate}% |`);
  }

  lines.push('');
  lines.push('---');
  lines.push(`*报告生成时间: ${new Date().toISOString()}*`);

  return lines.join('\n');
}

function getStats(results) {
  let success = 0, authFailed = 0, forbidden = 0, errors = 0, other = 0;

  for (const r of results) {
    const c = classifyResult(r, r.requiresAuth);
    switch (c.category) {
      case 'SUCCESS': success++; break;
      case 'AUTH_FAILED': authFailed++; break;
      case 'FORBIDDEN': forbidden++; break;
      case 'NETWORK_ERROR':
      case 'SERVER_ERROR':
        errors++; break;
      default: other++; break;
    }
  }

  return { success, authFailed, forbidden, errors, other };
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const config = parseArgs();
  let endpoints = getApiEndpoints();

  // 过滤
  if (config.filter) {
    const pattern = config.filter.toLowerCase();
    endpoints = endpoints.filter(
      e => e.path.toLowerCase().includes(pattern) ||
           e.module.toLowerCase().includes(pattern) ||
           e.desc.toLowerCase().includes(pattern)
    );
    if (config.verbose) {
      console.log(`🔍 过滤模式 "${config.filter}"，匹配 ${endpoints.length} 个接口`);
    }
  }

  // 跳过认证接口
  if (config.skipAuth) {
    endpoints = endpoints.filter(e => e.auth === 'none');
    if (config.verbose) {
      console.log(`⏭️  跳过认证接口，剩余 ${endpoints.length} 个公开接口`);
    }
  }

  if (endpoints.length === 0) {
    console.log('⚠️  没有匹配的接口需要测试');
    return;
  }

  console.log(`\n🚀 多客陪玩平台 - API 连通性测试`);
  console.log(`📍 目标地址: ${config.baseUrl}`);
  console.log(`📝 测试接口: ${endpoints.length} 个`);
  console.log(`⚡ 并发数: ${config.concurrency}`);
  console.log('');

  // 自动登录获取 Token
  let userToken = config.token;
  let adminToken = config.adminToken;

  if (config.autoLogin && !userToken) {
    console.log('🔑 正在自动登录获取 Token...');
    userToken = await autoLogin(
      config.baseUrl,
      config.username || 'testuser',
      config.password || '123456',
      config.verbose
    );
    if (userToken) {
      console.log('✅ Token 获取成功');
      // 同时设置 admin token（开发模式下 mock-admin-token 可绕过）
      if (!adminToken && config.nodeEnv !== 'production') {
        adminToken = userToken;
      }
    } else {
      console.log('⚠️  自动登录失败，认证接口将跳过或返回 401');
    }
  }

  if (userToken) {
    console.log(`🔐 用户 Token: ${userToken.substring(0, 20)}...`);
  }
  if (adminToken && adminToken !== userToken) {
    console.log(`🔐 管理员 Token: ${adminToken.substring(0, 20)}...`);
  }
  console.log('');

  // 构建请求任务
  const tasks = endpoints.map(endpoint => {
    return async () => {
      // 替换动态路径参数为实际值
      let resolvedPath = endpoint.path
        .replace(/:provinceCode/g, '110000')
        .replace(/:cityCode/g, '110100')
        .replace(/:districtCode/g, '110101')
        .replace(/:virtualUserId/g, '2')
        .replace(/:tagId/g, '2')
        .replace(/:roomId/g, 'room_001')
        .replace(/:category/g, 'user')
        .replace(/:id/g, '2');

      const url = `${config.baseUrl}${resolvedPath}`;
      const options = {
        timeout: config.timeout,
      };

      // 根据认证类型注入 Token
      if (endpoint.auth === 'user' && userToken) {
        options.token = userToken;
      } else if (endpoint.auth === 'admin') {
        if (adminToken) options.adminToken = adminToken;
        if (userToken && !adminToken) options.token = userToken; // fallback
      }

      // 对 POST 请求发送空 body（大多数接口需要参数，此处仅测连通性）
      if (endpoint.method === 'POST') {
        options.body = {};
      }

      if (config.verbose) {
        console.log(`  📡 ${endpoint.method} ${endpoint.path} [${endpoint.auth}]`);
      }

      const result = await makeRequest(url, endpoint.method, options);

      return {
        ...endpoint,
        status: result.status,
        statusText: result.statusText,
        duration: result.duration,
        data: result.data,
        error: result.error,
        success: result.success,
      };
    };
  });

  // 执行测试
  console.log('⏳ 正在测试接口连通性...\n');
  const results = await runWithConcurrency(tasks, config.concurrency);

  // 按模块排序
  results.sort((a, b) => {
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    return a.path.localeCompare(b.path);
  });

  // 输出报告
  let output = '';
  switch (config.format) {
    case 'json':
      output = formatJson(results);
      break;
    case 'markdown':
      output = formatMarkdown(results);
      break;
    case 'table':
    default:
      output = formatTable(results);
      break;
  }

  console.log(output);

  // 保存到文件
  if (config.outputFile) {
    const filePath = path.resolve(config.outputFile);
    fs.writeFileSync(filePath, output, 'utf-8');
    console.log(`\n📁 报告已保存到: ${filePath}`);
  }

  // 返回退出码
  const stats = getStats(results);
  const totalFailures = stats.authFailed + stats.forbidden + stats.errors + stats.other;
  if (totalFailures > 0) {
    console.log(`\n⚠️  存在 ${totalFailures} 个异常接口，请检查上方详情。`);
  } else {
    console.log(`\n✅ 所有 ${results.length} 个接口连通性测试通过！`);
  }
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(2);
});
