# 多客陪玩平台 - API 接口连通性测试报告

> 测试时间: 2026-05-28T21:25:14.490Z
> 接口总数: 243

## 概览

| 状态 | 数量 |
|------|------|
| 🟢 正常 | 54 |
| 🟡 认证失败 | 126 |
| 🟠 权限不足 | 0 |
| 🔴 错误 | 36 |
| ⚪ 其他 | 27 |
| **总计** | **243** |

## 详细结果

| 模块 | 方法 | 接口路径 | 状态码 | 耗时 | 结果 |
|------|------|----------|--------|------|------|
| VIP | GET | `/api/vip/info` | 401 | 2ms | 🟡 认证失败 |
| VIP | POST | `/api/vip/order` | 401 | 3ms | 🟡 认证失败 |
| VIP | POST | `/api/vip/order/complete` | 401 | 2ms | 🟡 认证失败 |
| VIP | GET | `/api/vip/order/status` | 401 | 2ms | 🟡 认证失败 |
| VIP | GET | `/api/vip/orders` | 401 | 3ms | 🟡 认证失败 |
| VIP | GET | `/api/vip/packages` | 200 | 3ms | 🟢 正常 |
| 上传 | POST | `/api/upload/audio` | 401 | 2ms | 🟡 认证失败 |
| 上传 | POST | `/api/upload/image` | 401 | 3ms | 🟡 认证失败 |
| 上传 | POST | `/api/upload/video` | 401 | 2ms | 🟡 认证失败 |
| 举报 | POST | `/api/report` | 401 | 2ms | 🟡 认证失败 |
| 举报 | POST | `/api/report/handle` | 400 | 2ms | ⚪ 未知(400) |
| 举报 | GET | `/api/report/list` | 200 | 3ms | 🟢 正常 |
| 分享 | POST | `/api/share/qrcode` | 200 | 3ms | 🟢 正常 |
| 分享 | GET | `/api/share/qrcode` | 200 | 3ms | 🟢 正常 |
| 圈子 | GET | `/api/circle/admin/posts` | 200 | 4ms | 🟢 正常 |
| 圈子 | POST | `/api/circle/comment` | 401 | 3ms | 🟡 认证失败 |
| 圈子 | GET | `/api/circle/comments` | 400 | 41ms | ⚪ 未知(400) |
| 圈子 | POST | `/api/circle/create` | 401 | 40ms | 🟡 认证失败 |
| 圈子 | POST | `/api/circle/like` | 401 | 4ms | 🟡 认证失败 |
| 圈子 | GET | `/api/circle/my-posts` | 401 | 41ms | 🟡 认证失败 |
| 圈子 | GET | `/api/circle/post/:id` | 422 | 5ms | ⚪ 未知(422) |
| 圈子 | GET | `/api/circle/posts` | 500 | 2ms | 🔴 服务端错误 |
| 圈子 | GET | `/api/circle/tags` | 200 | 3ms | 🟢 正常 |
| 圈子 | POST | `/api/circle/unlock` | 401 | 4ms | 🟡 认证失败 |
| 地区 | GET | `/api/region/cities/:provinceCode` | 200 | 1ms | 🟢 正常 |
| 地区 | GET | `/api/region/districts/:cityCode` | 200 | 1ms | 🟢 正常 |
| 地区 | GET | `/api/region/provinces` | 200 | 4ms | 🟢 正常 |
| 地区 | GET | `/api/region/search` | 400 | 2ms | ⚪ 未知(400) |
| 地区 | GET | `/api/region/townships/:districtCode` | 200 | 2ms | 🟢 正常 |
| 支付 | POST | `/api/pay/create-order` | 401 | 4ms | 🟡 认证失败 |
| 支付 | GET | `/api/pay/order-status` | 401 | 2ms | 🟡 认证失败 |
| 支付 | GET | `/api/pay/packages` | 200 | 3ms | 🟢 正常 |
| 支付 | POST | `/api/pay/pay/create` | 401 | 2ms | 🟡 认证失败 |
| 支付 | POST | `/api/pay/pay/notify` | 400 | 3ms | ⚪ 未知(400) |
| 支付 | GET | `/api/pay/payment/history` | 401 | 2ms | 🟡 认证失败 |
| 支付 | GET | `/api/pay/recharge/list` | 200 | 3ms | 🟢 正常 |
| 支付 | POST | `/api/pay/use-card` | 401 | 4ms | 🟡 认证失败 |
| 支付 | POST | `/api/pay/validate-card` | 400 | 3ms | ⚪ 未知(400) |
| 支付 | GET | `/api/pay/wallet/balance` | 401 | 3ms | 🟡 认证失败 |
| 支付 | POST | `/api/pay/wallet/recharge` | 401 | 4ms | 🟡 认证失败 |
| 支付 | POST | `/api/pay/wx-callback` | 400 | 3ms | ⚪ 未知(400) |
| 支付 | POST | `/api/pay/wx-close` | 401 | 3ms | 🟡 认证失败 |
| 支付 | POST | `/api/pay/wx-notify` | --- | 10002ms | 🔴 网络错误 |
| 支付 | POST | `/api/pay/wx-order` | 401 | 4ms | 🟡 认证失败 |
| 支付 | GET | `/api/pay/wx-query` | 401 | 2ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag` | 401 | 2ms | 🟡 认证失败 |
| 标签 | POST | `/api/tag` | 401 | 3ms | 🟡 认证失败 |
| 标签 | PUT | `/api/tag/:id` | 401 | 2ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag/:id` | 401 | 3ms | 🟡 认证失败 |
| 标签 | DELETE | `/api/tag/:id` | 401 | 3ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag/:tagId/users` | 401 | 2ms | 🟡 认证失败 |
| 标签 | POST | `/api/tag/assign` | 401 | 3ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag/category/:category` | 401 | 4ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag/defaults` | 401 | 2ms | 🟡 认证失败 |
| 标签 | POST | `/api/tag/init-defaults` | 401 | 3ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag/recommend` | 401 | 3ms | 🟡 认证失败 |
| 标签 | POST | `/api/tag/remove` | 401 | 3ms | 🟡 认证失败 |
| 标签 | POST | `/api/tag/set-primary` | 401 | 3ms | 🟡 认证失败 |
| 标签 | GET | `/api/tag/user/:virtualUserId` | 401 | 2ms | 🟡 认证失败 |
| 游戏 | POST | `/api/games/apply` | 401 | 2ms | 🟡 认证失败 |
| 游戏 | GET | `/api/games/apply/status` | 401 | 2ms | 🟡 认证失败 |
| 游戏 | POST | `/api/games/cancel` | 401 | 2ms | 🟡 认证失败 |
| 游戏 | GET | `/api/games/categories` | 500 | 3ms | 🔴 服务端错误 |
| 游戏 | GET | `/api/games/companions` | 500 | 3ms | 🔴 服务端错误 |
| 游戏 | POST | `/api/games/complete` | 401 | 3ms | 🟡 认证失败 |
| 游戏 | POST | `/api/games/grab` | 401 | 3ms | 🟡 认证失败 |
| 游戏 | GET | `/api/games/orders` | 401 | 3ms | 🟡 认证失败 |
| 游戏 | POST | `/api/games/push` | 401 | 3ms | 🟡 认证失败 |
| 游戏 | POST | `/api/games/start` | 401 | 3ms | 🟡 认证失败 |
| 用户 | GET | `/api/user/fans` | 401 | 3ms | 🟡 认证失败 |
| 用户 | POST | `/api/user/follow` | 401 | 15ms | 🟡 认证失败 |
| 用户 | GET | `/api/user/follows` | 401 | 4ms | 🟡 认证失败 |
| 用户 | GET | `/api/user/get` | 401 | 7ms | 🟡 认证失败 |
| 用户 | POST | `/api/user/login` | 400 | 24ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/login-mobile` | 400 | 6ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/login-third` | 400 | 7ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/refresh-token` | 400 | 6ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/register` | 400 | 25ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/reset-password` | 400 | 16ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/send-sms` | 400 | 6ms | ⚪ 未知(400) |
| 用户 | POST | `/api/user/update` | 401 | 13ms | 🟡 认证失败 |
| 相册 | POST | `/api/album/delete` | 401 | 3ms | 🟡 认证失败 |
| 相册 | POST | `/api/album/like` | 401 | 3ms | 🟡 认证失败 |
| 相册 | GET | `/api/album/photos` | 401 | 3ms | 🟡 认证失败 |
| 相册 | POST | `/api/album/upload` | 401 | 2ms | 🟡 认证失败 |
| 礼物 | POST | `/api/gift/admin/withdraw/approve` | 401 | 5ms | 🟡 认证失败 |
| 礼物 | GET | `/api/gift/admin/withdraw/list` | 401 | 5ms | 🟡 认证失败 |
| 礼物 | POST | `/api/gift/admin/withdraw/reject` | 401 | 5ms | 🟡 认证失败 |
| 礼物 | GET | `/api/gift/bag` | 401 | 3ms | 🟡 认证失败 |
| 礼物 | GET | `/api/gift/list` | 200 | 4ms | 🟢 正常 |
| 礼物 | GET | `/api/gift/redpacket/history` | 401 | 3ms | 🟡 认证失败 |
| 礼物 | POST | `/api/gift/redpacket/receive` | 401 | 5ms | 🟡 认证失败 |
| 礼物 | POST | `/api/gift/redpacket/send` | 401 | 5ms | 🟡 认证失败 |
| 礼物 | POST | `/api/gift/send` | 401 | 3ms | 🟡 认证失败 |
| 礼物 | POST | `/api/gift/withdraw` | 401 | 4ms | 🟡 认证失败 |
| 管理 | GET | `/api/admin/banners` | 200 | 2ms | 🟢 正常 |
| 管理 | POST | `/api/admin/banners` | 500 | 2ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/banners/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/banners/:id` | 500 | 2ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/banners/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/banners/:id/status` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/companion-applications` | 200 | 2ms | 🟢 正常 |
| 管理 | GET | `/api/admin/companion-applications/:id` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/companion-applications/:id` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/companion-applications/:id/approve` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/companion-applications/:id/reject` | 500 | 1ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/dashboard` | 200 | 3ms | 🟢 正常 |
| 管理 | GET | `/api/admin/games` | 200 | 2ms | 🟢 正常 |
| 管理 | POST | `/api/admin/games` | 400 | 8ms | ⚪ 未知(400) |
| 管理 | PUT | `/api/admin/games/:id` | 200 | 5ms | 🟢 正常 |
| 管理 | GET | `/api/admin/games/:id` | 200 | 8ms | 🟢 正常 |
| 管理 | DELETE | `/api/admin/games/:id` | 200 | 4ms | 🟢 正常 |
| 管理 | PUT | `/api/admin/games/:id/status` | 200 | 8ms | 🟢 正常 |
| 管理 | GET | `/api/admin/gift-logs` | 200 | 43ms | 🟢 正常 |
| 管理 | GET | `/api/admin/gift-logs/:id` | 200 | 39ms | 🟢 正常 |
| 管理 | GET | `/api/admin/gifts` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | POST | `/api/admin/gifts` | 422 | 7ms | ⚪ 未知(422) |
| 管理 | PUT | `/api/admin/gifts/:id` | 422 | 3ms | ⚪ 未知(422) |
| 管理 | GET | `/api/admin/gifts/:id` | 500 | 7ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/gifts/:id` | 500 | 44ms | 🔴 服务端错误 |
| 管理 | POST | `/api/admin/handle-report` | 200 | 3ms | 🟢 正常 |
| 管理 | POST | `/api/admin/login` | 500 | 2ms | 🔴 服务端错误 |
| 管理 | POST | `/api/admin/orders` | 500 | 1ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/orders` | 200 | 6ms | 🟢 正常 |
| 管理 | GET | `/api/admin/orders/:id` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/orders/:id` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/orders/:id/status` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/posts` | 200 | 2ms | 🟢 正常 |
| 管理 | GET | `/api/admin/posts/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/posts/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/recharge-records` | 200 | 42ms | 🟢 正常 |
| 管理 | DELETE | `/api/admin/recharge-records/:id` | 200 | 2ms | 🟢 正常 |
| 管理 | GET | `/api/admin/recharge-records/:id` | 200 | 6ms | 🟢 正常 |
| 管理 | GET | `/api/admin/recharges` | 200 | 5ms | 🟢 正常 |
| 管理 | GET | `/api/admin/recharges/:id` | 200 | 5ms | 🟢 正常 |
| 管理 | GET | `/api/admin/reports` | 200 | 5ms | 🟢 正常 |
| 管理 | GET | `/api/admin/reports/:id` | 200 | 3ms | 🟢 正常 |
| 管理 | DELETE | `/api/admin/reports/:id` | 200 | 3ms | 🟢 正常 |
| 管理 | POST | `/api/admin/reports/:id/handle` | 200 | 4ms | 🟢 正常 |
| 管理 | POST | `/api/admin/review-withdraw` | 500 | 2ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/settings` | 200 | 2ms | 🟢 正常 |
| 管理 | PUT | `/api/admin/settings` | 200 | 3ms | 🟢 正常 |
| 管理 | GET | `/api/admin/statistics` | 200 | 2ms | 🟢 正常 |
| 管理 | POST | `/api/admin/update-user-status` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/user-detail` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | POST | `/api/admin/users` | 200 | 4ms | 🟢 正常 |
| 管理 | GET | `/api/admin/users` | 200 | 4ms | 🟢 正常 |
| 管理 | GET | `/api/admin/users/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/users/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/users/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/users/:id/status` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | GET | `/api/admin/vip-packages` | 200 | 2ms | 🟢 正常 |
| 管理 | POST | `/api/admin/vip-packages` | 200 | 4ms | 🟢 正常 |
| 管理 | PUT | `/api/admin/vip-packages/:id` | 200 | 1ms | 🟢 正常 |
| 管理 | GET | `/api/admin/vip-packages/:id` | 200 | 4ms | 🟢 正常 |
| 管理 | DELETE | `/api/admin/vip-packages/:id` | 200 | 6ms | 🟢 正常 |
| 管理 | PUT | `/api/admin/vip-packages/:id/status` | 200 | 6ms | 🟢 正常 |
| 管理 | POST | `/api/admin/virtual-users` | 422 | 6ms | ⚪ 未知(422) |
| 管理 | GET | `/api/admin/virtual-users` | 200 | 9ms | 🟢 正常 |
| 管理 | GET | `/api/admin/virtual-users/:id` | 404 | 1ms | ⚪ 接口不存在 |
| 管理 | DELETE | `/api/admin/virtual-users/:id` | 404 | 3ms | ⚪ 接口不存在 |
| 管理 | PUT | `/api/admin/virtual-users/:id` | 422 | 5ms | ⚪ 未知(422) |
| 管理 | GET | `/api/admin/virtual-users/:id/chat-history` | 500 | 2ms | 🔴 服务端错误 |
| 管理 | PUT | `/api/admin/virtual-users/:id/status` | 404 | 4ms | ⚪ 接口不存在 |
| 管理 | GET | `/api/admin/withdraws` | 200 | 5ms | 🟢 正常 |
| 管理 | GET | `/api/admin/withdraws/:id` | 500 | 4ms | 🔴 服务端错误 |
| 管理 | DELETE | `/api/admin/withdraws/:id` | 500 | 3ms | 🔴 服务端错误 |
| 管理 | POST | `/api/admin/withdraws/:id/approve` | 500 | 5ms | 🔴 服务端错误 |
| 管理 | POST | `/api/admin/withdraws/:id/reject` | 500 | 2ms | 🔴 服务端错误 |
| 管理配置 | GET | `/api/admin-manage/admins` | 401 | 2ms | 🟡 认证失败 |
| 管理配置 | POST | `/api/admin-manage/admins` | 401 | 3ms | 🟡 认证失败 |
| 管理配置 | PUT | `/api/admin-manage/admins/:id` | 401 | 3ms | 🟡 认证失败 |
| 管理配置 | DELETE | `/api/admin-manage/admins/:id` | 401 | 5ms | 🟡 认证失败 |
| 管理配置 | PUT | `/api/admin-manage/admins/:id/password` | 401 | 5ms | 🟡 认证失败 |
| 管理配置 | GET | `/api/admin-manage/current` | 401 | 3ms | 🟡 认证失败 |
| 管理配置 | GET | `/api/admin-manage/init` | 200 | 3ms | 🟢 正常 |
| 管理配置 | POST | `/api/admin-manage/login` | 400 | 3ms | ⚪ 未知(400) |
| 管理配置 | GET | `/api/admin-manage/permissions` | 401 | 8ms | 🟡 认证失败 |
| 管理配置 | GET | `/api/admin-manage/roles` | 401 | 6ms | 🟡 认证失败 |
| 管理配置 | POST | `/api/admin-manage/roles` | 401 | 5ms | 🟡 认证失败 |
| 管理配置 | PUT | `/api/admin-manage/roles/:id` | 401 | 9ms | 🟡 认证失败 |
| 管理配置 | DELETE | `/api/admin-manage/roles/:id` | 401 | 8ms | 🟡 认证失败 |
| 系统 | GET | `/api/health` | 200 | 53ms | 🟢 正常 |
| 系统 | GET | `/api/health/db` | 200 | 22ms | 🟢 正常 |
| 系统 | GET | `/api/test` | 200 | 23ms | 🟢 正常 |
| 聊天 | GET | `/api/chat/list` | 401 | 6ms | 🟡 认证失败 |
| 聊天 | POST | `/api/chat/mark-read` | 401 | 9ms | 🟡 认证失败 |
| 聊天 | GET | `/api/chat/messages` | 401 | 6ms | 🟡 认证失败 |
| 聊天 | POST | `/api/chat/revoke` | 401 | 4ms | 🟡 认证失败 |
| 聊天 | POST | `/api/chat/room/create` | 401 | 3ms | 🟡 认证失败 |
| 聊天 | GET | `/api/chat/room/info` | 401 | 3ms | 🟡 认证失败 |
| 聊天 | GET | `/api/chat/rooms` | 500 | 3ms | 🔴 服务端错误 |
| 聊天 | POST | `/api/chat/send` | 401 | 4ms | 🟡 认证失败 |
| 虚拟用户 | GET | `/api/virtual-user` | 401 | 4ms | 🟡 认证失败 |
| 虚拟用户 | POST | `/api/virtual-user` | 401 | 3ms | 🟡 认证失败 |
| 虚拟用户 | GET | `/api/virtual-user/:id` | 401 | 3ms | 🟡 认证失败 |
| 虚拟用户 | PUT | `/api/virtual-user/:id` | 401 | 2ms | 🟡 认证失败 |
| 虚拟用户 | DELETE | `/api/virtual-user/:id` | 401 | 2ms | 🟡 认证失败 |
| 虚拟用户 | POST | `/api/virtual-user/:id/status` | 401 | 3ms | 🟡 认证失败 |
| 虚拟用户 | POST | `/api/virtual-user/:virtualUserId/chat` | 401 | 2ms | 🟡 认证失败 |
| 虚拟用户 | DELETE | `/api/virtual-user/:virtualUserId/context` | 401 | 2ms | 🟡 认证失败 |
| 虚拟用户 | GET | `/api/virtual-user/:virtualUserId/history` | 401 | 2ms | 🟡 认证失败 |
| 运营 | POST | `/api/banner` | 200 | 54ms | 🟢 正常 |
| 运营 | GET | `/api/banner/:id` | 404 | 54ms | ⚪ 接口不存在 |
| 运营 | PUT | `/api/banner/:id` | 404 | 54ms | ⚪ 接口不存在 |
| 运营 | DELETE | `/api/banner/:id` | 404 | 56ms | ⚪ 接口不存在 |
| 运营 | PUT | `/api/banner/:id/status` | 404 | 4ms | ⚪ 接口不存在 |
| 运营 | GET | `/api/banner/list` | 200 | 9ms | 🟢 正常 |
| 需求 | POST | `/api/demand/cancel` | 401 | 2ms | 🟡 认证失败 |
| 需求 | POST | `/api/demand/create` | 401 | 2ms | 🟡 认证失败 |
| 需求 | GET | `/api/demand/detail` | 401 | 3ms | 🟡 认证失败 |
| 需求 | GET | `/api/demand/list` | 401 | 2ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/accept` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | GET | `/api/trtc/auth` | 401 | 4ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/billing/end` | 401 | 2ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/billing/start` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/cancel` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/end` | 401 | 2ms | 🟡 认证失败 |
| 音视频 | GET | `/api/trtc/history` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/reject` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | GET | `/api/trtc/room/:roomId` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/room/create` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/room/enter` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/room/leave` | 401 | 3ms | 🟡 认证失败 |
| 音视频 | POST | `/api/trtc/start` | 401 | 5ms | 🟡 认证失败 |
| 项目 | GET | `/api/project` | 401 | 2ms | 🟡 认证失败 |
| 项目 | POST | `/api/project` | 401 | 3ms | 🟡 认证失败 |
| 项目 | GET | `/api/project/:id` | 401 | 2ms | 🟡 认证失败 |
| 项目 | PUT | `/api/project/:id` | 401 | 2ms | 🟡 认证失败 |
| 项目 | DELETE | `/api/project/:id` | 401 | 3ms | 🟡 认证失败 |
| 项目 | POST | `/api/project/:id/restart` | 401 | 3ms | 🟡 认证失败 |
| 项目 | POST | `/api/project/:id/start` | 401 | 3ms | 🟡 认证失败 |
| 项目 | POST | `/api/project/:id/stop` | 401 | 2ms | 🟡 认证失败 |
| 项目 | GET | `/api/project/stats` | 401 | 2ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/cancel` | 401 | 4ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/complete` | 401 | 4ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/confirm` | 401 | 4ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/create` | 401 | 4ms | 🟡 认证失败 |
| 预约 | GET | `/api/reserve/list` | 401 | 4ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/reject` | 401 | 4ms | 🟡 认证失败 |
| 预约 | GET | `/api/reserve/slots` | 401 | 3ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/slots/batch` | 401 | 4ms | 🟡 认证失败 |
| 预约 | POST | `/api/reserve/slots/toggle` | 401 | 4ms | 🟡 认证失败 |

## 失败/异常接口

| 方法 | 接口路径 | 状态 | 说明 |
|------|----------|------|------|
| GET | `/api/vip/info` | 401 | 未提供认证令牌 |
| POST | `/api/vip/order` | 401 | 未提供认证令牌 |
| POST | `/api/vip/order/complete` | 401 | 未提供认证令牌 |
| GET | `/api/vip/order/status` | 401 | 未提供认证令牌 |
| GET | `/api/vip/orders` | 401 | 未提供认证令牌 |
| POST | `/api/upload/audio` | 401 | 未提供认证令牌 |
| POST | `/api/upload/image` | 401 | 未提供认证令牌 |
| POST | `/api/upload/video` | 401 | 未提供认证令牌 |
| POST | `/api/report` | 401 | 未提供认证令牌 |
| POST | `/api/report/handle` | 400 | 举报ID不能为空 |
| POST | `/api/circle/comment` | 401 | 未提供认证令牌 |
| GET | `/api/circle/comments` | 400 | 帖子ID不能为空 |
| POST | `/api/circle/create` | 401 | 未提供认证令牌 |
| POST | `/api/circle/like` | 401 | 未提供认证令牌 |
| GET | `/api/circle/my-posts` | 401 | 未提供认证令牌 |
| GET | `/api/circle/post/:id` | 422 | Post is not defined |
| GET | `/api/circle/posts` | 500 | Post is not defined |
| POST | `/api/circle/unlock` | 401 | 未提供认证令牌 |
| GET | `/api/region/search` | 400 | 搜索关键词至少2个字符 |
| POST | `/api/pay/create-order` | 401 | 未提供认证令牌 |
| GET | `/api/pay/order-status` | 401 | 未提供认证令牌 |
| POST | `/api/pay/pay/create` | 401 | 未提供认证令牌 |
| POST | `/api/pay/pay/notify` | 400 | 缺少必要参数 |
| GET | `/api/pay/payment/history` | 401 | 未提供认证令牌 |
| POST | `/api/pay/use-card` | 401 | 未提供认证令牌 |
| POST | `/api/pay/validate-card` | 400 | 密卡不能为空 |
| GET | `/api/pay/wallet/balance` | 401 | 未提供认证令牌 |
| POST | `/api/pay/wallet/recharge` | 401 | 未提供认证令牌 |
| POST | `/api/pay/wx-callback` | 400 | 订单号不能为空 |
| POST | `/api/pay/wx-close` | 401 | 未提供认证令牌 |
| POST | `/api/pay/wx-notify` | N/A | 请求超时 |
| POST | `/api/pay/wx-order` | 401 | 未提供认证令牌 |
| GET | `/api/pay/wx-query` | 401 | 未提供认证令牌 |
| GET | `/api/tag` | 401 | 未提供认证令牌 |
| POST | `/api/tag` | 401 | 未提供认证令牌 |
| PUT | `/api/tag/:id` | 401 | 未提供认证令牌 |
| GET | `/api/tag/:id` | 401 | 未提供认证令牌 |
| DELETE | `/api/tag/:id` | 401 | 未提供认证令牌 |
| GET | `/api/tag/:tagId/users` | 401 | 未提供认证令牌 |
| POST | `/api/tag/assign` | 401 | 未提供认证令牌 |
| GET | `/api/tag/category/:category` | 401 | 未提供认证令牌 |
| GET | `/api/tag/defaults` | 401 | 未提供认证令牌 |
| POST | `/api/tag/init-defaults` | 401 | 未提供认证令牌 |
| GET | `/api/tag/recommend` | 401 | 未提供认证令牌 |
| POST | `/api/tag/remove` | 401 | 未提供认证令牌 |
| POST | `/api/tag/set-primary` | 401 | 未提供认证令牌 |
| GET | `/api/tag/user/:virtualUserId` | 401 | 未提供认证令牌 |
| POST | `/api/games/apply` | 401 | 未提供认证令牌 |
| GET | `/api/games/apply/status` | 401 | 未提供认证令牌 |
| POST | `/api/games/cancel` | 401 | 未提供认证令牌 |
| GET | `/api/games/categories` | 500 | Game is not defined |
| GET | `/api/games/companions` | 500 | CompanionProfile is not defined |
| POST | `/api/games/complete` | 401 | 未提供认证令牌 |
| POST | `/api/games/grab` | 401 | 未提供认证令牌 |
| GET | `/api/games/orders` | 401 | 未提供认证令牌 |
| POST | `/api/games/push` | 401 | 未提供认证令牌 |
| POST | `/api/games/start` | 401 | 未提供认证令牌 |
| GET | `/api/user/fans` | 401 | 未提供认证令牌 |
| POST | `/api/user/follow` | 401 | 未提供认证令牌 |
| GET | `/api/user/follows` | 401 | 未提供认证令牌 |
| GET | `/api/user/get` | 401 | 未提供认证令牌 |
| POST | `/api/user/login` | 400 | 用户名和密码不能为空 |
| POST | `/api/user/login-mobile` | 400 | 手机号和验证码不能为空 |
| POST | `/api/user/login-third` | 400 | 登录类型和授权码不能为空 |
| POST | `/api/user/refresh-token` | 400 | refresh token不能为空 |
| POST | `/api/user/register` | 400 | 手机号、密码和验证码不能为空 |
| POST | `/api/user/reset-password` | 400 | 手机号、密码和验证码不能为空 |
| POST | `/api/user/send-sms` | 400 | 请输入正确的手机号 |
| POST | `/api/user/update` | 401 | 未提供认证令牌 |
| POST | `/api/album/delete` | 401 | 未提供认证令牌 |
| POST | `/api/album/like` | 401 | 未提供认证令牌 |
| GET | `/api/album/photos` | 401 | 未提供认证令牌 |
| POST | `/api/album/upload` | 401 | 未提供认证令牌 |
| POST | `/api/gift/admin/withdraw/approve` | 401 | 未提供认证令牌 |
| GET | `/api/gift/admin/withdraw/list` | 401 | 未提供认证令牌 |
| POST | `/api/gift/admin/withdraw/reject` | 401 | 未提供认证令牌 |
| GET | `/api/gift/bag` | 401 | 未提供认证令牌 |
| GET | `/api/gift/redpacket/history` | 401 | 未提供认证令牌 |
| POST | `/api/gift/redpacket/receive` | 401 | 未提供认证令牌 |
| POST | `/api/gift/redpacket/send` | 401 | 未提供认证令牌 |
| POST | `/api/gift/send` | 401 | 未提供认证令牌 |
| POST | `/api/gift/withdraw` | 401 | 未提供认证令牌 |
| POST | `/api/admin/banners` | 500 | 标题和图片不能为空 |
| GET | `/api/admin/banners/:id` | 500 | Banner不存在 |
| PUT | `/api/admin/banners/:id` | 500 | Banner不存在 |
| DELETE | `/api/admin/banners/:id` | 500 | Banner不存在 |
| PUT | `/api/admin/banners/:id/status` | 500 | Banner不存在 |
| GET | `/api/admin/companion-applications/:id` | 500 | 申请不存在 |
| DELETE | `/api/admin/companion-applications/:id` | 500 | 申请不存在 |
| PUT | `/api/admin/companion-applications/:id/approve` | 500 | 申请不存在 |
| PUT | `/api/admin/companion-applications/:id/reject` | 500 | 申请不存在 |
| POST | `/api/admin/games` | 400 | 服务名称不能为空 |
| GET | `/api/admin/gifts` | 500 | Gift is not defined |
| POST | `/api/admin/gifts` | 422 | 礼物名称、图片和价格不能为空 |
| PUT | `/api/admin/gifts/:id` | 422 | Gift is not defined |
| GET | `/api/admin/gifts/:id` | 500 | Gift is not defined |
| DELETE | `/api/admin/gifts/:id` | 500 | Gift is not defined |
| POST | `/api/admin/login` | 500 | 用户名和密码不能为空 |
| POST | `/api/admin/orders` | 500 | GameOrder is not defined |
| GET | `/api/admin/orders/:id` | 500 | GameOrder is not defined |
| DELETE | `/api/admin/orders/:id` | 500 | GameOrder is not defined |
| PUT | `/api/admin/orders/:id/status` | 500 | GameOrder is not defined |
| GET | `/api/admin/posts/:id` | 500 | Post is not defined |
| DELETE | `/api/admin/posts/:id` | 500 | Post is not defined |
| POST | `/api/admin/review-withdraw` | 500 | Withdraw is not defined |
| POST | `/api/admin/update-user-status` | 500 | 用户不存在 |
| GET | `/api/admin/user-detail` | 500 | 用户不存在 |
| GET | `/api/admin/users/:id` | 500 | 用户不存在 |
| PUT | `/api/admin/users/:id` | 500 | 用户不存在 |
| DELETE | `/api/admin/users/:id` | 500 | 用户不存在 |
| PUT | `/api/admin/users/:id/status` | 500 | 用户不存在 |
| POST | `/api/admin/virtual-users` | 422 | 用户名和昵称不能为空 |
| GET | `/api/admin/virtual-users/:id` | 404 | 虚拟用户不存在 |
| DELETE | `/api/admin/virtual-users/:id` | 404 | 虚拟用户不存在 |
| PUT | `/api/admin/virtual-users/:id` | 422 | 虚拟用户不存在 |
| GET | `/api/admin/virtual-users/:id/chat-history` | 500 | VirtualChatHistory.findAndCountAll is not a function |
| PUT | `/api/admin/virtual-users/:id/status` | 404 | 虚拟用户不存在 |
| GET | `/api/admin/withdraws/:id` | 500 | Withdraw is not defined |
| DELETE | `/api/admin/withdraws/:id` | 500 | Withdraw is not defined |
| POST | `/api/admin/withdraws/:id/approve` | 500 | Withdraw is not defined |
| POST | `/api/admin/withdraws/:id/reject` | 500 | Withdraw is not defined |
| GET | `/api/admin-manage/admins` | 401 | 未提供认证令牌 |
| POST | `/api/admin-manage/admins` | 401 | 未提供认证令牌 |
| PUT | `/api/admin-manage/admins/:id` | 401 | 未提供认证令牌 |
| DELETE | `/api/admin-manage/admins/:id` | 401 | 未提供认证令牌 |
| PUT | `/api/admin-manage/admins/:id/password` | 401 | 未提供认证令牌 |
| GET | `/api/admin-manage/current` | 401 | 未提供认证令牌 |
| POST | `/api/admin-manage/login` | 400 | 用户名和密码不能为空 |
| GET | `/api/admin-manage/permissions` | 401 | 未提供认证令牌 |
| GET | `/api/admin-manage/roles` | 401 | 未提供认证令牌 |
| POST | `/api/admin-manage/roles` | 401 | 未提供认证令牌 |
| PUT | `/api/admin-manage/roles/:id` | 401 | 未提供认证令牌 |
| DELETE | `/api/admin-manage/roles/:id` | 401 | 未提供认证令牌 |
| GET | `/api/chat/list` | 401 | 未提供认证令牌 |
| POST | `/api/chat/mark-read` | 401 | 未提供认证令牌 |
| GET | `/api/chat/messages` | 401 | 未提供认证令牌 |
| POST | `/api/chat/revoke` | 401 | 未提供认证令牌 |
| POST | `/api/chat/room/create` | 401 | 未提供认证令牌 |
| GET | `/api/chat/room/info` | 401 | 未提供认证令牌 |
| GET | `/api/chat/rooms` | 500 | ChatRoom.findAndCountAll is not a function |
| POST | `/api/chat/send` | 401 | 未提供认证令牌 |
| GET | `/api/virtual-user` | 401 | 未提供认证令牌 |
| POST | `/api/virtual-user` | 401 | 未提供认证令牌 |
| GET | `/api/virtual-user/:id` | 401 | 未提供认证令牌 |
| PUT | `/api/virtual-user/:id` | 401 | 未提供认证令牌 |
| DELETE | `/api/virtual-user/:id` | 401 | 未提供认证令牌 |
| POST | `/api/virtual-user/:id/status` | 401 | 未提供认证令牌 |
| POST | `/api/virtual-user/:virtualUserId/chat` | 401 | 未提供认证令牌 |
| DELETE | `/api/virtual-user/:virtualUserId/context` | 401 | 未提供认证令牌 |
| GET | `/api/virtual-user/:virtualUserId/history` | 401 | 未提供认证令牌 |
| GET | `/api/banner/:id` | 404 | Banner不存在 |
| PUT | `/api/banner/:id` | 404 | Banner不存在 |
| DELETE | `/api/banner/:id` | 404 | Banner不存在 |
| PUT | `/api/banner/:id/status` | 404 | Banner不存在 |
| POST | `/api/demand/cancel` | 401 | 未提供认证令牌 |
| POST | `/api/demand/create` | 401 | 未提供认证令牌 |
| GET | `/api/demand/detail` | 401 | 未提供认证令牌 |
| GET | `/api/demand/list` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/accept` | 401 | 未提供认证令牌 |
| GET | `/api/trtc/auth` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/billing/end` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/billing/start` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/cancel` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/end` | 401 | 未提供认证令牌 |
| GET | `/api/trtc/history` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/reject` | 401 | 未提供认证令牌 |
| GET | `/api/trtc/room/:roomId` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/room/create` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/room/enter` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/room/leave` | 401 | 未提供认证令牌 |
| POST | `/api/trtc/start` | 401 | 未提供认证令牌 |
| GET | `/api/project` | 401 | 未提供认证令牌 |
| POST | `/api/project` | 401 | 未提供认证令牌 |
| GET | `/api/project/:id` | 401 | 未提供认证令牌 |
| PUT | `/api/project/:id` | 401 | 未提供认证令牌 |
| DELETE | `/api/project/:id` | 401 | 未提供认证令牌 |
| POST | `/api/project/:id/restart` | 401 | 未提供认证令牌 |
| POST | `/api/project/:id/start` | 401 | 未提供认证令牌 |
| POST | `/api/project/:id/stop` | 401 | 未提供认证令牌 |
| GET | `/api/project/stats` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/cancel` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/complete` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/confirm` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/create` | 401 | 未提供认证令牌 |
| GET | `/api/reserve/list` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/reject` | 401 | 未提供认证令牌 |
| GET | `/api/reserve/slots` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/slots/batch` | 401 | 未提供认证令牌 |
| POST | `/api/reserve/slots/toggle` | 401 | 未提供认证令牌 |

## 按模块统计

| 模块 | 总数 | 正常 | 异常 | 通过率 |
|------|------|------|------|--------|
| VIP | 6 | 1 | 5 | 16.7% |
| 上传 | 3 | 0 | 3 | 0.0% |
| 举报 | 3 | 1 | 2 | 33.3% |
| 分享 | 2 | 2 | 0 | 100.0% |
| 圈子 | 10 | 2 | 8 | 20.0% |
| 地区 | 5 | 4 | 1 | 80.0% |
| 支付 | 16 | 2 | 14 | 12.5% |
| 标签 | 14 | 0 | 14 | 0.0% |
| 游戏 | 10 | 0 | 10 | 0.0% |
| 用户 | 12 | 0 | 12 | 0.0% |
| 相册 | 4 | 0 | 4 | 0.0% |
| 礼物 | 10 | 1 | 9 | 10.0% |
| 管理 | 74 | 35 | 39 | 47.3% |
| 管理配置 | 13 | 1 | 12 | 7.7% |
| 系统 | 3 | 3 | 0 | 100.0% |
| 聊天 | 8 | 0 | 8 | 0.0% |
| 虚拟用户 | 9 | 0 | 9 | 0.0% |
| 运营 | 6 | 2 | 4 | 33.3% |
| 需求 | 4 | 0 | 4 | 0.0% |
| 音视频 | 13 | 0 | 13 | 0.0% |
| 项目 | 9 | 0 | 9 | 0.0% |
| 预约 | 9 | 0 | 9 | 0.0% |

---
*报告生成时间: 2026-05-28T21:25:14.491Z*