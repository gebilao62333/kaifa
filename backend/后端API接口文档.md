# eu搭子 - 后端 API 接口文档

> 版本: v6.4
> 更新时间: 2026-09-30
> v6.4 变更: ①修正 2.1 用户信息响应——删除代码未返回的 7 个字段（vipExpireTime/totalGiftBalance/isDaRen/isManager/userStatus/createTime/lastLoginTime），保留实际返回的 14 个字段与 authService.getUserInfo 一致；②修正 3.6 房间创建请求体（{ targetUserId, type } → { title, subtitle, background, roomType }）与 chat.js 路由一致
> v6.3 变更: ①修正 3.1 聊天列表响应字段（roomId→id, targetUserId→fromId/toId, lastMessage→content, lastMessageTime→sendTime，删除分页参数）与 chatService.getChatList 一致；②修正 3.2 聊天消息响应字段（messageId→id, fromUserId→fromId, toUserId→toId, status→isSelf/isRevoked, createTime→sendTime）与 chatService.getChatMessages 一致；③2.1 用户信息响应补全 isFollow 字段；④2.13 refresh-token 认证要求从"需要"改为"无需认证"
> v6.2 变更: ①修正 2.1 用户信息响应字段（gender:"female"→sex:2, region→city, 删除不存在的 followCount, 补全 giftBalance/isDaRen/isManager/userStatus/description）；②修正 2.2 更新用户信息请求体（signature→description）；③修正 2.3 关注请求体（userId→targetUserId, 补全 action 参数）；④补全 18.1 用户字段映射表（新增 gift_money/gift_money_zong/fans_num/is_dav/is_manage_normal/status/jinyan_time/dec 映射）；⑤修正 sex 字段映射说明（直接传数字 0/1/2，不做 gender 字符串转换）

## 1. 接口规范

### 1.1 通用说明

- **基础地址**: `/api`
- **数据格式**: JSON
- **认证方式**: JWT Token (放在 `Authorization: Bearer <token>` 请求头)
- **开发环境**: Mock 数据库模式 (无需真实 MySQL)

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 1.3 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 / Token 无效 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 422 | 业务逻辑错误 |
| 429 | 请求频率限制 |
| 500 | 服务器内部错误 |

### 1.4 中间件

| 中间件 | 说明 |
|--------|------|
| `authMiddleware` | 需要登录认证 |
| `optionalAuth` | 可选登录认证 |
| `adminAuth` | 管理员权限 |
| `loginLimiter` | 登录频率限制 |
| `smsLimiter` | 短信频率限制 |
| `uploadLimiter` | 上传频率限制 |

---

## 2. 用户模块 (`/api/user`)

### 2.1 获取用户信息

- **接口**: `GET /api/user/get`
- **认证**: 需要
- **参数**: `?userId=xxx` (可选，不传则获取当前登录用户)
- **响应**:
```json
{
  "code": 200,
  "data": {
    "userId": 1,
    "nickname": "小雪",
    "avatar": "https://picsum.photos/200/200",
    "level": 28,
    "vip": 1,
    "vipLevel": 3,
    "sex": 2,
    "city": "北京",
    "balance": 500000.00,
    "giftBalance": 12000.00,
    "score": 12500,
    "fansCount": 256,
    "isFollow": false,
    "description": "个性签名"
  }
}
```

### 2.2 更新用户信息

- **接口**: `POST /api/user/update`
- **认证**: 需要
- **请求体**: 
```json
{
  "nickname": "新昵称",
  "avatar": "url",
  "sex": 1,
  "city": "北京",
  "description": "个性签名"
}
```
- **响应**: `{ "code": 200, "message": "更新成功" }`

### 2.3 关注用户

- **接口**: `POST /api/user/follow`
- **认证**: 需要
- **请求体**: `{ "targetUserId": 123, "action": 1 }`（action: 1=关注, 2=取消关注）
- **响应**: `{ "code": 200, "message": "关注成功" }`（取消关注时 message 为 "取消关注成功"）

### 2.4 获取粉丝列表

- **接口**: `GET /api/user/fans`
- **认证**: 需要
- **参数**: `?page=1&pageSize=20`
- **响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      { "userId": 123, "nickname": "用户A", "avatar": "url", "level": 10 }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2.5 获取关注列表

- **接口**: `GET /api/user/follows`
- **认证**: 需要
- **参数**: `?page=1&pageSize=20`
- **响应**: 与粉丝列表格式相同

### 2.6 发送短信验证码

- **接口**: `POST /api/user/send-sms`
- **认证**: 不需要
- **限流**: `smsLimiter`
- **请求体**: `{ "mobile": "13800138000" }`

### 2.7 手机号登录

- **接口**: `POST /api/user/login-mobile`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "mobile": "13800138000", "code": "1234" }`
- **响应**:
```json
{
  "code": 200,
  "data": {
    "token": "jwt_token_string",
    "userId": 1,
    "nickname": "小雪"
  }
}
```

### 2.8 账号密码登录

- **接口**: `POST /api/user/login`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "username": "xxx", "password": "xxx" }`

### 2.9 注册

- **接口**: `POST /api/user/register`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "phone": "13800138000", "password": "xxx", "code": "1234" }`

### 2.10 重置密码

- **接口**: `POST /api/user/reset-password`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "phone": "13800138000", "password": "xxx", "code": "1234" }`

### 2.11 第三方登录

- **接口**: `POST /api/user/login-third`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "platform": "wechat", "openId": "xxx" }`

### 2.12 检查关注状态

- **接口**: `GET /api/user/check-follow`
- **认证**: 需要
- **参数**: `?userId=123`
- **响应**: `{ "code": 200, "data": { "isFollowing": true } }`

### 2.13 刷新 Token

- **接口**: `POST /api/user/refresh-token`
- **认证**: 无需认证（使用 refresh_token 换取新 access_token）
- **说明**: 旧 Token 即将过期时换取新 Token。

---

## 3. 聊天模块 (`/api/chat`)

### 3.1 获取聊天列表

- **接口**: `GET /api/chat/list`
- **认证**: 需要
- **参数**: `?page=1&pageSize=20`
- **响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "fromId": 123,
        "toId": 1,
        "nickname": "用户A",
        "avatar": "url",
        "content": "你好",
        "sendTime": 1715040000,
        "unreadCount": 2
      }
    ],
    "total": 10
  }
}
```

### 3.2 获取聊天消息

- **接口**: `GET /api/chat/messages`
- **认证**: 需要
- **参数**: `?targetUserId=123&page=1&pageSize=20`
- **响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "fromId": 1,
        "toId": 123,
        "content": "你好",
        "type": 0,
        "mediaUrl": "",
        "duration": 0,
        "sendTime": 1715040000,
        "isSelf": true,
        "isRevoked": false
      }
    ],
    "total": 100
  }
}
```
- **消息类型**: 0-文字, 1-图片, 2-语音, 3-视频, 4-位置, 5-礼物, 6-红包, 7-系统

### 3.3 发送消息

- **接口**: `POST /api/chat/send`
- **认证**: 需要
- **请求体**:
```json
{
  "targetUserId": 123,
  "content": "你好",
  "type": 0,
  "mediaUrl": "",
  "duration": 0
}
```

### 3.4 撤回消息

- **接口**: `POST /api/chat/revoke`
- **认证**: 需要
- **请求体**: `{ "messageId": "xxx" }`

### 3.5 标记已读

- **接口**: `POST /api/chat/mark-read`
- **认证**: 需要
- **请求体**: `{ "targetUserId": 123 }`

### 3.6 房间管理

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/chat/room/create` | POST | 需要 | 创建聊天房间（`{ title, subtitle, background, roomType }`） |
| `/api/chat/room/info` | GET | 需要 | 房间信息（`?roomId=xxx`） |
| `/api/chat/rooms` | GET | 需要 | 当前用户所有房间列表 |

---

## 4. 礼物模块 (`/api/gift`)

### 4.1 获取礼物列表

- **接口**: `GET /api/gift/list`
- **认证**: 不需要

### 4.2 赠送礼物

- **接口**: `POST /api/gift/send`
- **认证**: 需要
- **请求体**: `{ "receiverId": 123, "giftId": 1, "count": 1 }`

### 4.3 获取礼物背包

- **接口**: `GET /api/gift/bag`
- **认证**: 需要

### 4.4 礼物提现

- **接口**: `POST /api/gift/withdraw`
- **认证**: 需要

### 4.5 提现管理（管理端）

> 2026-10-03 变更：原来的 `/api/gift/admin/withdraw/*` 三个端点已**删除**——它们只挂了普通用户 JWT 鉴权，
> 任意登录用户即可审核提现（越权）。提现审核统一走管理端接口，见本文档「22.4 提现管理 `/api/admin/withdraws`」，
> 鉴权口径为 `adminAuth` + `withdraw:read` / `withdraw:write` 权限。

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/withdraws` | GET | withdraw:read | 提现列表 |
| `/api/admin/withdraws/:id` | GET | withdraw:read | 提现详情 |
| `/api/admin/withdraws/:id/approve` | POST | withdraw:write | 审核通过 |
| `/api/admin/withdraws/:id/reject` | POST | withdraw:write | 审核驳回 |

### 4.6 红包系统

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/gift/redpacket/send` | POST | 发送红包 |
| `/api/gift/redpacket/receive` | POST | 领取红包 |
| `/api/gift/redpacket/history` | GET | 红包记录 |

---

## 5. 支付模块 (`/api/pay`)

### 5.1 获取充值套餐

- **接口**: `GET /api/pay/packages`
- **认证**: 不需要

### 5.2 创建充值订单

- **接口**: `POST /api/pay/create-order`
- **认证**: 需要

### 5.3 微信支付下单

- **接口**: `POST /api/pay/wx-order`
- **认证**: 需要

### 5.4 微信支付回调

- **接口**: `POST /api/pay/wx-notify`
- **认证**: 不需要

### 5.5 查询微信订单

- **接口**: `GET /api/pay/wx-query`
- **认证**: 需要

### 5.6 关闭微信订单

- **接口**: `POST /api/pay/wx-close`
- **认证**: 需要

### 5.7 查询订单状态

- **接口**: `GET /api/pay/order-status`
- **认证**: 需要

### 5.8 卡券相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/pay/validate-card` | POST | 不需要 | 验证卡券 |
| `/api/pay/use-card` | POST | 需要 | 使用卡券 |
| `/api/pay/redeem-key` | POST | 需要 | 卡密兑换（按密钥兑换余额/VIP） |
| `/api/pay/wx-callback` | POST | 不需要 | 客户端支付回执（2026-10-03 起必须经服务端反查订单确认后才入账，否则 403） |
| `/api/pay/recharge/list` | GET | 管理员 | 充值记录列表（2026-10-03 起改为 `adminAuth`，原先无鉴权可遍历全站订单） |
| `/api/pay/wallet/balance` | GET | 需要 | 获取钱包余额 |
| `/api/pay/wallet/recharge` | POST | 管理员 | 钱包充值（2026-10-03 起限 `adminAuth` + `recharge:write`；此前任何登录用户可无限自助加余额） |
| `/api/games/order/detail` | GET | 本人/接单方 | 订单详情（2026-10-03 起校验归属，此前任意用户可按 ID 查看任何订单） |
| `/api/vip/order-status` | GET | 本人 | VIP 订单状态（2026-10-03 起校验归属） |
| `/api/reserve/detail` | GET | 本人/接单方 | 预约详情（2026-10-03 起校验归属） |
| `/api/demand/detail` | GET | 公开 | 需求详情；`offlineLocation` 仅发布者可见（2026-10-03） |
| `/api/pay/payment/history` | GET | 需要 | 支付历史记录 |
| `/api/pay/pay/create` | POST | 需要 | 创建支付订单 |
| ~~`/api/pay/pay/notify`~~ | — | — | **已删除（2026-10-03）**：无签名校验，可伪造支付成功；官方回调见 `/api/pay/wx-notify` |

---

## 6. 游戏模块 (`/api/games`)

### 6.1 获取游戏分类

- **接口**: `GET /api/games/categories`
- **认证**: 不需要

### 6.2 获取游戏陪玩师

- **接口**: `GET /api/games/companions`
- **认证**: 需要

### 6.3 游戏订单操作

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/games/push` | POST | 发布订单 |
| `/api/games/grab` | POST | 抢单 |
| `/api/games/start` | POST | 开始订单 |
| `/api/games/complete` | POST | 完成订单 |
| `/api/games/cancel` | POST | 取消订单 |
| `/api/games/orders` | GET | 获取订单列表 |

### 6.4 陪玩师申请

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/games/apply` | POST | 申请成为陪玩师 |
| `/api/games/apply/status` | GET | 查询申请状态 |

### 6.5 陪玩师详情

- **接口**: `GET /api/games/companions/:companionId`
- **认证**: 需要
- **说明**: 获取单个陪玩师详细信息（评分/接单量/标签等）。

### 6.6 搜索陪玩师

- **接口**: `GET /api/games/search`
- **认证**: 需要
- **参数**: `?keyword=xxx&page=1&pageSize=10`

### 6.7 订单详情

- **接口**: `GET /api/games/order-detail`
- **认证**: 需要
- **参数**: `?orderId=xxx`

### 6.8 评价订单

- **接口**: `POST /api/games/evaluate`
- **认证**: 需要
- **请求体**: `{ "orderId": "xxx", "score": 5, "content": "评价内容" }`

### 6.9 数据统计

- **接口**: `GET /api/games/statistics`
- **认证**: 需要
- **说明**: 当前用户作为陪玩师的数据统计（接单量/收入/评分）。

---

## 7. 圈子/广场模块 (`/api/circle`)

### 7.1 获取话题标签

- **接口**: `GET /api/circle/tags`
- **认证**: 不需要

### 7.2 获取帖子列表

- **接口**: `GET /api/circle/posts`
- **认证**: 可选
- **参数**: `?page=1&pageSize=10&tag=游戏`

### 7.3 获取帖子详情

- **接口**: `GET /api/circle/post/:id`
- **认证**: 可选

### 7.4 获取我的帖子

- **接口**: `GET /api/circle/my-posts`
- **认证**: 需要

### 7.5 获取评论

- **接口**: `GET /api/circle/comments`
- **认证**: 不需要
- **参数**: `?postId=123`

### 7.6 创建帖子

- **接口**: `POST /api/circle/create`
- **认证**: 需要
- **请求体**:
```json
{
  "content": "今天玩王者太开心了！",
  "images": ["url1", "url2"],
  "tags": ["游戏"],
  "price": 0
}
```

### 7.7 解锁付费帖子

- **接口**: `POST /api/circle/unlock`
- **认证**: 需要

### 7.8 点赞

- **接口**: `POST /api/circle/like`
- **认证**: 需要
- **请求体**: `{ "postId": 123 }`

### 7.9 评论

- **接口**: `POST /api/circle/comment`
- **认证**: 需要
- **请求体**: `{ "postId": 123, "content": "好厉害！" }`

### 7.10 删除动态（级联清理媒资）

- **接口**: `POST /api/circle/delete`
- **认证**: 需要
- **请求体**: `{ "postId": 123 }`
- **说明**: 删除动态时按 postId 级联清理底层存储（COS/本地）与媒资登记表，避免孤儿文件。

> 动态列表/详情返回的 `images`、`videos` 均为带时效的 COS 签名 URL（默认 600s），用于防盗刷。

### 7.11 管理端帖子列表

- **接口**: `GET /api/circle/admin/posts`
- **认证**: 管理员
- **说明**: 供后台审核使用，含未发布/已删除等全状态帖子。

### 7.12 分享帖子

- **接口**: `POST /api/circle/share`
- **认证**: 需要
- **请求体**: `{ "postId": 123 }`

### 7.13 转发帖子

- **接口**: `POST /api/circle/repost`
- **认证**: 需要
- **请求体**: `{ "postId": 123, "content": "转发评论" }`

### 7.14 分享状态

- **接口**: `GET /api/circle/share-status`
- **认证**: 不需要
- **参数**: `?postId=123`
- **说明**: 查询帖子被分享次数等状态。

---

## 8. 预约模块 (`/api/reserve`)

### 8.1 获取可用时间段

- **接口**: `GET /api/reserve/slots`
- **认证**: 需要
- **参数**: `?companionId=123&date=2026-05-22`

### 8.2 批量创建时间段

- **接口**: `POST /api/reserve/slots/batch`
- **认证**: 需要

### 8.3 切换时间段可用性

- **接口**: `POST /api/reserve/slots/toggle`
- **认证**: 需要

### 8.4 创建预约

- **接口**: `POST /api/reserve/create`
- **认证**: 需要
- **请求体**:
```json
{
  "companionId": 123,
  "date": "2026-05-22",
  "startTime": "09:00",
  "endTime": "11:00",
  "remark": "备注信息"
}
```

### 8.5 确认预约（陪玩师端）

- **接口**: `POST /api/reserve/confirm`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`

### 8.6 拒绝预约（陪玩师端）

- **接口**: `POST /api/reserve/reject`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`

### 8.7 取消预约

- **接口**: `POST /api/reserve/cancel`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`

### 8.8 完成预约

- **接口**: `POST /api/reserve/complete`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`

### 8.9 获取预约列表

- **接口**: `GET /api/reserve/list`
- **认证**: 需要
- **参数**: `?type=all&page=1&pageSize=10`

### 8.10 获取预约详情

- **接口**: `GET /api/reserve/detail`
- **认证**: 需要
- **参数**: `?reserveId=xxx`

---

## 9. 需求发布模块 (`/api/demand`)

### 9.1 创建需求

- **接口**: `POST /api/demand/create`
- **认证**: 需要
- **请求体**:
```json
{
  "serviceType": "online",
  "game": "王者荣耀",
  "date": "2026-05-22",
  "startTime": "09:00",
  "endTime": "11:00",
  "duration": 2,
  "budget": 100,
  "remark": "需要女生、声音好听",
  "offlineLocation": "",
  "gender": "female",
  "ageStart": 18,
  "ageEnd": 25,
  "tags": ["温柔", "技术好"]
}
```

### 9.2 获取需求列表

- **接口**: `GET /api/demand/list`
- **认证**: 需要
- **参数**: `?page=1&pageSize=10`

### 9.3 获取需求详情

- **接口**: `GET /api/demand/detail`
- **认证**: 需要
- **参数**: `?demandId=xxx`

### 9.4 取消需求

- **接口**: `POST /api/demand/cancel`
- **认证**: 需要
- **请求体**: `{ "demandId": "xxx" }`

---

> 注：章节编号 10 已废弃（原管理后台章节，现合并至第 22 节），编号 19 为历史跳号（19.3 数据库配置沿用旧编号），均无实际内容缺失。

## 11. 音视频通话模块 (`/api/trtc`)

> **双通道支持**：TRTC（腾讯云）为主通道，WebRTC（浏览器原生）为备选通道。前端通过 `callService` 自动检测和切换。

### 11.1 通话核心接口

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/trtc/auth` | GET | 需要 | 获取TRTC签名 |
| `/api/trtc/start` | POST | 需要 | 发起通话 |
| `/api/trtc/cancel` | POST | 需要 | 取消通话 |
| `/api/trtc/reject` | POST | 需要 | 拒绝通话 |
| `/api/trtc/accept` | POST | 需要 | 接受通话 |
| `/api/trtc/end` | POST | 需要 | 结束通话 |
| `/api/trtc/history` | GET | 需要 | 通话记录 |

### 11.2 TRTC 房间管理

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/trtc/room/create` | POST | 需要 | 创建TRTC房间 |
| `/api/trtc/room/enter` | POST | 需要 | 进入TRTC房间 |
| `/api/trtc/room/leave` | POST | 需要 | 离开TRTC房间 |
| `/api/trtc/room/:roomId` | GET | 需要 | 获取房间信息 |

### 11.3 通话计费

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/trtc/billing/start` | POST | 需要 | 开始通话计费 |
| `/api/trtc/billing/end` | POST | 需要 | 结束通话计费 |

---

## 12. VIP会员模块 (`/api/vip`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/vip/packages` | GET | 不需要 | VIP套餐列表 |
| `/api/vip/info` | GET | 需要 | 用户VIP信息 |
| `/api/vip/order` | POST | 需要 | 创建VIP订单 |
| `/api/vip/order/complete` | POST | 需要 | 完成VIP订单 |
| `/api/vip/order/status` | GET | 需要 | 查询订单状态 |
| `/api/vip/orders` | GET | 需要 | 用户VIP订单列表 |

---

## 13. 相册模块 (`/api/album`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/album/photos` | GET | 需要 | 获取相册照片列表（图片/缩略图返回带时效的 COS 签名 URL，防盗刷） |
| `/api/album/upload` | POST | 需要 | 上传照片（前端已直传 COS，此处接收 `{url, description, privacy, password, price}` 并登记媒资） |
| `/api/album/delete` | POST | 需要 | 删除照片（同步清理 COS/本地文件与媒资登记） |
| `/api/album/like` | POST | 需要 | 点赞照片 |

---

## 14. 标签管理模块 (`/api/tag`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/tag` | GET | 需要 | 获取所有标签 |
| `/api/tag` | POST | 管理员 | 创建标签 |
| `/api/tag/:id` | GET | 需要 | 获取标签详情 |
| `/api/tag/:id` | PUT | 管理员 | 更新标签 |
| `/api/tag/:id` | DELETE | 管理员 | 删除标签 |
| `/api/tag/defaults` | GET | 需要 | 获取默认标签 |
| `/api/tag/recommend` | GET | 需要 | 推荐标签 |
| `/api/tag/category/:category` | GET | 需要 | 按分类获取 |
| `/api/tag/init-defaults` | POST | 管理员 | 初始化默认标签 |
| `/api/tag/:tagId/users` | GET | 需要 | 标签下的用户 |
| `/api/tag/assign` | POST | 管理员 | 分配标签 |
| `/api/tag/remove` | POST | 管理员 | 移除标签 |
| `/api/tag/user/:virtualUserId` | GET | 需要 | 用户拥有的标签 |
| `/api/tag/set-primary` | POST | 管理员 | 设置主要标签 |

---

## 15. 虚拟用户模块 (`/api/virtual-user`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/virtual-user` | GET | 需要 | 虚拟用户列表 |
| `/api/virtual-user` | POST | 管理员 | 创建虚拟用户 |
| `/api/virtual-user/:id` | GET | 需要 | 虚拟用户详情 |
| `/api/virtual-user/:id` | PUT | 管理员 | 更新虚拟用户 |
| `/api/virtual-user/:id` | DELETE | 管理员 | 删除虚拟用户 |
| `/api/virtual-user/:id/status` | POST | 管理员 | 切换在线状态 |
| `/api/virtual-user/:virtualUserId/chat` | POST | 需要 | AI聊天 |
| `/api/virtual-user/:virtualUserId/history` | GET | 需要 | 聊天历史 |
| `/api/virtual-user/:virtualUserId/context` | DELETE | 需要 | 清除上下文 |

---

## 16. 其他模块

### 16.1 上传模块 (`/api/upload`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/upload/image` | POST | 需要 | 上传图片（后端中转兜底，COS未配置或直传失败时回退使用） |
| `/api/upload/audio` | POST | 需要 | 上传音频（兜底） |
| `/api/upload/video` | POST | 需要 | 上传视频（兜底） |
| `/api/upload/token` | GET | 需要 | 获取前端直传 COS 的预签名 PUT URL（`?type=image\|audio\|video\|file&ext=.jpg`），前端据此直传，绕过后端文件流中转，节省服务器带宽 |
| `/api/upload/register` | POST | 需要 | 直传完成后回传访问 URL 登记到统一媒资表 `xn_media_asset`（只存 URL 索引，可审计、可级联删除），返回 `assetId` |

> **推荐流程**：前端先 `GET /api/upload/token` 拿预签名凭证 → 用 `PUT` 直传 COS → `POST /api/upload/register` 回传 URL 登记。COS 不可用时前端 `uploadService` 自动回退到 `/api/upload/*` 后端中转。

### 16.2 举报模块 (`/api/report`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/report` | POST | 需要 | 提交举报 |
| `/api/report/list` | GET | 可选认证 | 举报列表 |
| `/api/report/detail` | GET | 可选认证 | 举报详情（`?reportId=xxx`） |
| `/api/report/handle` | POST | 可选认证 | 处理举报 |

### 16.3 行政区划 (`/api/region`)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/region/provinces` | GET | 省份列表 |
| `/api/region/cities/:provinceCode` | GET | 城市列表 |
| `/api/region/districts/:cityCode` | GET | 区县列表 |
| `/api/region/townships/:districtCode` | GET | 乡镇列表 |
| `/api/region/search` | GET | 搜索地区 |

### 16.4 健康检查

- **接口**: `GET /api/health`
- **响应**: `{ "code": 200, "data": { "status": "healthy", "timestamp": 1234567890 } }`

### 16.5 P2P 热内容取回流 (`/api/p2p`)

前端资源请求方通过 WebRTC DataChannel 让"资源拥有方"点对点回传小文件（头像/缩略图等），减轻服务器带宽；不可达时回退到 COS 签名 URL。

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/p2p/peer-online` | GET | 需要 | 查询对方是否在线（`?peerId=123`），用于 P2P 可达性探测 |

> Socket 信令事件（后端转发）：`p2p_fetch_request` / `p2p_fetch_response` / `p2p_offer` / `p2p_answer` / `p2p_ice_candidate`。具体传输由前端 `p2pFetchService` 与 `webrtcCallService` 完成。

### 16.6 Banner 模块 (`/api/banner`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/banner/list` | GET | 不需要 | Banner 列表（启用中的，分页） |
| `/api/banner/all` | GET | 管理员 | 全部 Banner（含禁用，2026-10-03 起限 `adminAuth` + `splash:read`） |

### 16.7 开屏弹窗模块 (`/api/splash`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/splash/active` | GET | 不需要 | 获取当前启用的开屏弹窗 |

### 16.8 配置模块 (`/api/config`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/config/home` | GET | 不需要 | 首页聚合配置（Banner/快捷入口/推荐陪玩师一次拉取） |

### 16.9 下载模块 (`/api/download`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/download/platforms` | GET | 不需要 | 平台下载项列表（iOS/Android 等） |
| `/api/download/:platform` | GET | 不需要 | 按 platform 重定向到下载地址 |

### 16.10 搜索模块 (`/api/search`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/search/hot` | GET | 不需要 | 热搜词列表 |
| `/api/search/posts` | GET | 需要 | 搜索帖子（`?keyword=xxx&page=1&pageSize=10`） |
| `/api/search/games` | GET | 需要 | 搜索游戏/陪玩师（`?keyword=xxx`） |

### 16.11 公告模块 (`/api/notice`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/notice/list` | GET | 不需要 | 公告列表 |

### 16.12 意见反馈模块 (`/api/feedback`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/feedback/submit` | POST | 需要 | 提交意见反馈 |
| `/api/feedback/my` | GET | 需要 | 我的反馈记录 |

---

## 17. WebSocket 实时通讯

### 17.1 连接

- **地址**: 后端根地址（默认命名空间 `/`，`socket/index.js` 未定义 `/chat` 等自定义命名空间）
- **认证**: 通过握手 `auth.token` 参数传递 JWT（无效/匿名连接将被拒绝）
- **重连**: 客户端指数退避自动重连；服务端通过 `@socket.io/redis-adapter` 支持多实例横向扩展

### 17.2 客户端事件（19 个）

| 事件 | 说明 | 数据 |
|------|------|------|
| `private_message` | 发送私聊消息（落库 `xn_chat_log`） | `{ toId, content, type, mediaUrl, duration }` |
| `room_message` | 房间消息（仅实时广播，不落库） | `{ roomId, content, type, mediaUrl, duration }` |
| `join_room` | 加入房间 | `{ roomId }` |
| `leave_room` | 离开房间 | `{ roomId }` |
| `call_invite` | 发起通话邀请 | `{ toId, callType, trtcRoomId, callId, useWebRTC }` |
| `call_cancel` | 取消通话邀请 | `{ toId }` |
| `call_reject` | 拒绝通话 | `{ toId }` |
| `call_accept` | 接受通话 | `{ toId, trtcRoomId }` |
| `call_end` | 结束通话 | `{ toId, duration }` |
| `webrtc_offer` | WebRTC Offer | `{ toId, sdp }` |
| `webrtc_answer` | WebRTC Answer | `{ toId, sdp }` |
| `webrtc_ice_candidate` | WebRTC ICE候选 | `{ toId, candidate }` |
| `typing` | 打字状态推送 | `{ toId }` |
| `revoke_message` | 消息撤回（对端收到 `message_revoked`） | `{ toId, messageId }` |
| `p2p_fetch_request` | P2P 取流请求（请求方 → 拥有方） | `{ toId, requestId, url, type }` |
| `p2p_fetch_response` | P2P 取流响应（拥有方 → 请求方） | `{ toId, requestId, payload, fallbackUrl }` |
| `p2p_offer` | P2P DataChannel Offer | `{ toId, requestId, offer, url, type }` |
| `p2p_answer` | P2P DataChannel Answer | `{ toId, requestId, answer }` |
| `p2p_ice_candidate` | P2P ICE候选 | `{ toId, requestId, candidate }` |

### 17.3 服务端事件（21 个）

| 事件 | 说明 | 数据 |
|------|------|------|
| `private_message` | 接收私聊消息 | `{ id, fromId, toId, fromName, fromAvatar, content, type, mediaUrl, duration, sendTime, isRevoked }` |
| `private_message_ack` | 消息送达回执 | `{ id, sendTime }` |
| `room_message` | 接收房间消息 | `{ id, roomId, fromId, fromName, fromAvatar, content, type, mediaUrl, duration, sendTime }` |
| `room_message_ack` | 房间消息回执 | `{ id, sendTime }` |
| `join_room_success` | 加入房间成功 | `{ roomId }` |
| `leave_room_success` | 离开房间成功 | `{ roomId }` |
| `typing` | 对方正在输入 | `{ fromId, fromName }` |
| `message_revoked` | 消息被撤回 | `{ messageId, fromId }` |
| `call_invite` | 来电邀请 | `{ fromId, fromName, fromAvatar, callType, trtcRoomId, callId, useWebRTC }` |
| `call_cancel` | 对方取消通话 | `{ fromId }` |
| `call_reject` | 通话被拒绝 | `{ fromId }` |
| `call_accept` | 通话被接受 | `{ fromId, trtcRoomId }` |
| `call_end` | 通话结束 | `{ fromId, duration }` |
| `webrtc_offer` | 收到WebRTC Offer | `{ fromId, sdp }` |
| `webrtc_answer` | 收到WebRTC Answer | `{ fromId, sdp }` |
| `webrtc_ice_candidate` | 收到ICE候选 | `{ fromId, candidate }` |
| `p2p_fetch_request` | P2P 取流请求转发 | `{ fromId, requestId, url, type }` |
| `p2p_fetch_response` | P2P 取流响应转发 | `{ fromId, requestId, payload, fallbackUrl }` |
| `p2p_offer` | P2P Offer 转发 | `{ fromId, requestId, offer, url, type }` |
| `p2p_answer` | P2P Answer 转发 | `{ fromId, requestId, answer }` |
| `p2p_ice_candidate` | P2P ICE候选转发 | `{ fromId, requestId, candidate }` |

> 另有通用 `error` 事件（`{ message }`）用于操作失败回执。

---

## 18. 数据模型

### 18.1 用户表 (MySQL - xn_user)

| 字段 | 类型 | 说明 | 前端映射 | 一致性状态 |
|------|------|------|----------|------------|
| `id` | BIGINT | 用户ID | userId | ✅ 一致 |
| `nickname` | VARCHAR | 昵称 | nickname | ✅ 一致 |
| `avatar` | VARCHAR | 头像URL | avatar | ✅ 一致 |
| `lv` | INT | 用户等级 | level | ✅ 一致 |
| `vip` | TINYINT | 是否VIP | vip | ✅ 一致 |
| `vip_lv` | INT | VIP等级 | vipLevel | ✅ 一致 |
| `vip_expire_time` | INT | VIP到期时间戳 | vipExpireTime | ✅ 一致 |
| `sex` | TINYINT | 性别 (0未知/1男/2女) | sex | ✅ 一致（直接传数字） |
| `city` | VARCHAR | 城市 | city | ✅ 一致 |
| `money` | DECIMAL | 金币余额 | balance | ✅ 一致 |
| `gift_money` | DECIMAL | 礼物收入余额 | giftBalance | ✅ 一致 |
| `gift_money_zong` | DECIMAL | 礼物收入总计 | totalGiftBalance | ✅ 一致 |
| `score` | INT | 积分 | score | ✅ 一致 |
| `fans_num` | INT | 粉丝数 | fansCount | ✅ 一致 |
| `is_dav` | TINYINT | 是否达人 | isDaRen | ✅ 一致 |
| `is_manage_normal` | TINYINT | 是否管理员 | isManager | ✅ 一致 |
| `status` | TINYINT | 用户状态 (0正常/1禁言) | userStatus | ✅ 一致 |
| `jinyan_time` | INT | 禁言结束时间戳 | muteEndTime | ✅ 一致 |
| `dec` | VARCHAR | 个性签名/简介 | description | ✅ 一致 |
| `create_time` | INT | 创建时间 | createTime | ✅ 一致 |
| `last_login_time` | INT | 最后登录时间 | lastLoginTime | ✅ 一致 |

> **字段命名规范说明**：后端数据库使用下划线命名（snake_case），前端使用驼峰命名（camelCase），映射关系已统一。

### 18.2 需求表 (MySQL - xn_demand)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT | 需求ID |
| `user_id` | BIGINT | 发布用户ID |
| `service_type` | VARCHAR | 服务类型 (online/offline) |
| `game_id` | INT | 游戏ID |
| `game_name` | VARCHAR | 游戏名称 |
| `date` | DATE | 预约日期 |
| `start_time` | TIME | 开始时间 |
| `end_time` | TIME | 结束时间 |
| `duration` | INT | 服务时长(小时) |
| `budget` | DECIMAL | 预算金额 |
| `remark` | VARCHAR | 备注 |
| `offline_location` | VARCHAR | 线下地点 |
| `gender` | VARCHAR | 陪玩师性别偏好 |
| `age_start` | INT | 年龄下限 |
| `age_end` | INT | 年龄上限 |
| `tags` | TEXT | 标签JSON数组 |
| `status` | VARCHAR | active/matched/completed/cancelled |
| `create_time` | INT | 创建时间 |
| `update_time` | INT | 更新时间 |

### 19.3 数据库配置

- **MySQL**: 用户、订单、游戏、礼物、需求、相册等核心业务数据；**聊天消息也存 MySQL**（`xn_chat_log` / `xn_chat_room`）
- **MongoDB**: 核心数据库，用于高频写入场景；`config/mongo.js` 连接配置
- **开发环境**: 支持 Mock 模式，无需真实数据库

---

## 20. 已移除模块

> 以下模块已根据业务调整移除，相关接口不再提供

| 模块 | 路径 | 移除说明 |
|------|------|----------|
| 排行榜 | `/api/rank` | 业务调整移除 |
| 派对 | `/api/party` | 业务调整移除 |
| 群组 | `/api/group` | 业务调整移除 |
| 活动 | `/api/activity` | 业务调整移除 |
| 团队 | `/api/team` | 业务调整移除 |

### 20.1 移除时间线

| 批次 | 日期 | 移除模块 |
|------|------|----------|
| 第一批 | 2026-05-20 | 排行榜、派对、群组 |
| 第二批 | 2026-05-23 | 活动、团队 |

---

## 21. 测试规范

### 21.1 测试框架

| 框架 | 版本 | 用途 |
|------|------|------|
| Jest | ^29.7.0 | 单元测试和集成测试 |
| Supertest | ^6.3.4 | HTTP API 测试 |

### 21.2 测试命令

```bash
# 运行所有测试
npm test

# 运行一致性测试
npm test -- --testPathPattern=consistency --verbose

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行测试覆盖率
npm run test:coverage
```

### 21.3 一致性测试

> 验证前后端技术一致性修复效果

| 测试文件 | 测试用例数 | 说明 |
|----------|-----------|------|
| `tests/unit/consistency/field-consistency.test.js` | 24 | 数据模型字段一致性 |
| `tests/unit/consistency/websocket-consistency.test.js` | 20 | WebSocket事件一致性 |
| **总计** | **44** | **全部通过** |

### 21.4 测试覆盖率要求

| 指标 | 最低要求 | 说明 |
|------|----------|------|
| 分支覆盖率 | 40% | 条件分支覆盖 |
| 函数覆盖率 | 50% | 函数定义覆盖 |
| 行覆盖率 | 50% | 代码行覆盖 |
| 语句覆盖率 | 50% | 语句覆盖 |

---

## 22. 管理后台模块

> 包含 `/api/admin`（资源管理）与 `/api/admin-manage`（管理员账号/角色）两个前缀。除 `/api/admin/login` 与 `/api/admin-manage/login` 外，所有端点均需 `adminAuth`（管理员登录）+ `requirePermission('<资源>:<读|写>')` 权限校验，下表统一省略认证列说明。

### 22.1 管理员登录

- **接口**: `POST /api/admin/login`
- **认证**: 不需要
- **请求体**: `{ "username": "xxx", "password": "xxx" }`
- **响应**: `{ "code": 200, "data": { "token": "xxx", "adminId": 1, "username": "admin" } }`

### 22.2 用户管理 `/api/admin/users`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/users` | GET | user:read | 用户列表（分页/搜索） |
| `/api/admin/users/:id` | GET | user:read | 用户详情 |
| `/api/admin/users` | POST | user:write | 创建用户 |
| `/api/admin/users/:id` | PUT | user:write | 更新用户 |
| `/api/admin/users/:id/status` | PUT | user:write | 更新用户状态（封禁/解封） |
| `/api/admin/users/:id` | DELETE | user:write | 删除用户 |
| `/api/admin/update-user-status` | POST | user:write | 旧版兼容：单字段更新状态 |
| `/api/admin/user-detail` | GET | user:read | 旧版兼容：用户详情 |

### 22.3 订单管理 `/api/admin/orders`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/orders` | GET | order:read | 订单列表 |
| `/api/admin/orders/:id` | GET | order:read | 订单详情 |
| `/api/admin/orders` | POST | order:write | 创建订单 |
| `/api/admin/orders/:id/status` | PUT | order:write | 更新订单状态 |
| `/api/admin/orders/:id` | DELETE | order:write | 删除订单 |

### 22.4 提现管理 `/api/admin/withdraws`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/withdraws` | GET | withdraw:read | 提现列表 |
| `/api/admin/withdraws/:id` | GET | withdraw:read | 提现详情 |
| `/api/admin/withdraws` | POST | withdraw:write | 创建提现 |
| `/api/admin/withdraws/:id/approve` | POST | withdraw:write | 审核通过 |
| `/api/admin/withdraws/:id/reject` | POST | withdraw:write | 审核驳回 |
| `/api/admin/withdraws/:id` | DELETE | withdraw:write | 删除提现 |
| `/api/admin/review-withdraw` | POST | withdraw:write | 旧版兼容：审核提现 |

### 22.5 帖子管理 `/api/admin/posts`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/posts` | GET | post:read | 帖子列表 |
| `/api/admin/posts/:id` | GET | post:read | 帖子详情 |
| `/api/admin/posts/:id` | DELETE | post:write | 删除帖子 |

### 22.6 举报管理 `/api/admin/reports`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/reports` | GET | report:read | 举报列表 |
| `/api/admin/reports/:id` | GET | report:read | 举报详情 |
| `/api/admin/reports/:id` | PUT | report:write | 更新举报（旧版） |
| `/api/admin/reports/:id/handle` | POST | report:write | 处理举报 |
| `/api/admin/reports/:id` | DELETE | report:write | 删除举报 |
| `/api/admin/handle-report` | POST | report:write | 旧版兼容：处理举报 |

### 22.7 Banner 管理 `/api/admin/banners`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/banners` | GET | splash:read | Banner 列表 |
| `/api/admin/banners/:id` | GET | splash:read | Banner 详情 |
| `/api/admin/banners` | POST | splash:write | 创建 Banner |
| `/api/admin/banners/:id` | PUT | splash:write | 更新 Banner |
| `/api/admin/banners/:id/status` | PUT | splash:write | 更新 Banner 状态 |
| `/api/admin/banners/:id` | DELETE | splash:write | 删除 Banner |

### 22.8 开屏管理 `/api/admin/splashes`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/splashes` | GET | splash:read | 开屏列表 |
| `/api/admin/splashes/:id` | GET | splash:read | 开屏详情 |
| `/api/admin/splashes` | POST | splash:write | 创建开屏 |
| `/api/admin/splashes/:id` | PUT | splash:write | 更新开屏 |
| `/api/admin/splashes/:id/status` | PUT | splash:write | 更新开屏状态 |
| `/api/admin/splashes/:id` | DELETE | splash:write | 删除开屏 |

### 22.9 下载管理 `/api/admin/downloads`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/downloads` | GET | download:read | 下载项列表 |
| `/api/admin/downloads/:id` | GET | download:read | 下载项详情 |
| `/api/admin/downloads` | POST | download:write | 创建下载项 |
| `/api/admin/downloads/:id` | PUT | download:write | 更新下载项 |
| `/api/admin/downloads/:id` | DELETE | download:write | 删除下载项 |

### 22.10 VIP 套餐管理 `/api/admin/vip-packages`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/vip-packages` | GET | vip:read | VIP 套餐列表 |
| `/api/admin/vip-packages/:id` | GET | vip:read | VIP 套餐详情 |
| `/api/admin/vip-packages` | POST | vip:write | 创建 VIP 套餐 |
| `/api/admin/vip-packages/:id` | PUT | vip:write | 更新 VIP 套餐 |
| `/api/admin/vip-packages/:id/status` | PUT | vip:write | 更新套餐状态 |
| `/api/admin/vip-packages/:id` | DELETE | vip:write | 删除 VIP 套餐 |

### 22.11 充值套餐管理 `/api/admin/recharge-packages`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/recharge-packages` | GET | vip:read | 充值套餐列表 |
| `/api/admin/recharge-packages/:id` | GET | vip:read | 充值套餐详情 |
| `/api/admin/recharge-packages` | POST | vip:write | 创建充值套餐 |
| `/api/admin/recharge-packages/:id` | PUT | vip:write | 更新充值套餐 |
| `/api/admin/recharge-packages/:id/status` | PUT | vip:write | 更新套餐状态 |
| `/api/admin/recharge-packages/:id` | DELETE | vip:write | 删除充值套餐 |

### 22.12 礼物管理 `/api/admin/gifts`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/gifts` | GET | gift:read | 礼物列表 |
| `/api/admin/gifts/:id` | GET | gift:read | 礼物详情 |
| `/api/admin/gifts` | POST | gift:write | 创建礼物 |
| `/api/admin/gifts/:id` | PUT | gift:write | 更新礼物 |
| `/api/admin/gifts/:id` | DELETE | gift:write | 删除礼物 |
| `/api/admin/gift-logs` | GET | gift:read | 礼物流水列表 |
| `/api/admin/gift-logs/:id` | GET | gift:read | 礼物流水详情 |

### 22.13 充值记录 `/api/admin/recharges`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/recharge-records` | GET | recharge:read | 充值记录列表 |
| `/api/admin/recharge-records/:id` | GET | recharge:read | 充值记录详情 |
| `/api/admin/recharge-records/:id` | DELETE | recharge:write | 删除充值记录 |
| `/api/admin/recharges` | GET | recharge:read | 别名：充值记录列表 |
| `/api/admin/recharges/:id` | GET | recharge:read | 别名：详情 |
| `/api/admin/recharges/:id` | DELETE | recharge:write | 别名：删除 |

### 22.14 游戏管理 `/api/admin/games`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/games` | GET | game:read | 游戏列表 |
| `/api/admin/games/:id` | GET | game:read | 游戏详情 |
| `/api/admin/games` | POST | game:write | 创建游戏 |
| `/api/admin/games/:id` | PUT | game:write | 更新游戏 |
| `/api/admin/games/:id/status` | PUT | game:write | 更新游戏状态 |
| `/api/admin/games/:id` | DELETE | game:write | 删除游戏 |

### 22.15 陪玩师申请管理 `/api/admin/companion-applications`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/companion-applications` | GET | companion:read | 申请列表 |
| `/api/admin/companion-applications/:id` | GET | companion:read | 申请详情 |
| `/api/admin/companion-applications/:id/approve` | PUT/POST | companion:write | 通过申请 |
| `/api/admin/companion-applications/:id/reject` | PUT/POST | companion:write | 驳回申请 |
| `/api/admin/companion-applications/:id` | DELETE | companion:write | 删除申请 |

### 22.16 虚拟用户管理 `/api/admin/virtual-users`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/virtual-users` | GET | virtual:read | 虚拟用户列表 |
| `/api/admin/virtual-users/:id` | GET | virtual:read | 虚拟用户详情 |
| `/api/admin/virtual-users` | POST | virtual:write | 创建虚拟用户 |
| `/api/admin/virtual-users/:id` | PUT | virtual:write | 更新虚拟用户 |
| `/api/admin/virtual-users/:id/status` | PUT | virtual:write | 切换在线状态 |
| `/api/admin/virtual-users/:id` | DELETE | virtual:write | 删除虚拟用户 |
| `/api/admin/virtual-users/:id/chat-history` | GET | virtual:read | 聊天历史 |

### 22.17 卡密管理 `/api/admin/cards`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/cards` | GET | card:read | 卡密列表 |
| `/api/admin/cards` | POST | card:write | 创建卡密 |
| `/api/admin/cards/:id` | DELETE | card:write | 删除卡密 |
| `/api/admin/cards/clear` | POST | card:write | 清空卡密 |
| `/api/admin/card-admins` | GET | card:read | 卡密可选管理员 |
| `/api/admin/card-admin-stats` | GET | card:read | 卡密统计 |

### 22.18 系统设置与仪表盘

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/settings` | GET | settings:read | 系统设置 |
| `/api/admin/settings` | PUT | settings:write | 更新系统设置 |
| `/api/admin/dashboard` | GET | dashboard:read | 仪表盘统计 |
| `/api/admin/statistics` | GET | dashboard:read | 别名：统计 |
| `/api/admin/finance/stats` | GET | finance:read | 财务统计 |

### 22.19 管理员账号管理 `/api/admin-manage`

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/admin-manage/login` | POST | 不需要 | 管理员登录 |
| `/api/admin-manage/current` | GET | adminAuth | 当前登录管理员 |
| `/api/admin-manage/admins` | GET | admin:write | 管理员列表 |
| `/api/admin-manage/admins` | POST | admin:write | 创建管理员 |
| `/api/admin-manage/admins/:id` | PUT | admin:write | 更新管理员 |
| `/api/admin-manage/admins/:id/password` | PUT | admin:write | 修改管理员密码 |
| `/api/admin-manage/admins/:id` | DELETE | admin:write | 删除管理员 |

### 22.20 角色与权限 `/api/admin-manage`

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/admin-manage/roles` | GET | admin:write | 角色列表 |
| `/api/admin-manage/roles` | POST | admin:write | 创建角色 |
| `/api/admin-manage/roles/:id` | PUT | admin:write | 更新角色 |
| `/api/admin-manage/roles/:id` | DELETE | admin:write | 删除角色 |
| `/api/admin-manage/permissions` | GET | admin:write | 权限列表 |

---

## 23. 项目管理模块 (`/api/project`)

> 内部项目管理（如部署项、服务项）的 CRUD 与生命周期操作。

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/project/stats` | GET | 需要 | 项目统计 |
| `/api/project` | GET | 需要 | 项目列表 |
| `/api/project` | POST | 需要 | 创建项目 |
| `/api/project/:id` | GET | 需要 | 项目详情 |
| `/api/project/:id` | PUT | 需要 | 更新项目 |
| `/api/project/:id` | DELETE | 需要 | 删除项目 |
| `/api/project/:id/start` | POST | 需要 | 启动项目 |
| `/api/project/:id/stop` | POST | 需要 | 停止项目 |
| `/api/project/:id/restart` | POST | 需要 | 重启项目 |

---

## 24. 钱包模块 (`/api/wallet`)

> 用户钱包流水：收入、支出、提现记录与统计概览，所有接口均需登录认证。

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/wallet/overview` | GET | 需要 | 钱包总览（余额/收入/支出汇总） |
| `/api/wallet/income-records` | GET | 需要 | 收入记录列表 |
| `/api/wallet/income-breakdown` | GET | 需要 | 收入分类明细 |
| `/api/wallet/withdraw-records` | GET | 需要 | 提现记录列表 |
| `/api/wallet/expense-records` | GET | 需要 | 支出记录列表 |
| `/api/wallet/expense-overview` | GET | 需要 | 支出分类概览 |
| `/api/wallet/withdraw` | POST | 需要 | 申请提现 |

---

## 25. 文档版本历史

| 版本 | 日期 | 更新内容 | 状态 |
|------|------|----------|------|
| v6.4.0 | 2026-09-30 | 用户信息响应精简与房间创建修正：①2.1 删除代码未返回的 7 个字段（vipExpireTime/totalGiftBalance/isDaRen/isManager/userStatus/createTime/lastLoginTime），保留 14 个实际字段；②3.6 房间创建请求体修正为 { title, subtitle, background, roomType } | ✅ 最新 |
| v6.3.0 | 2026-09-30 | 聊天接口字段对齐代码实现：①3.1 聊天列表响应字段修正（roomId→id, targetUserId→fromId/toId, lastMessage→content, lastMessageTime→sendTime）；②3.2 聊天消息响应字段修正（messageId→id, fromUserId→fromId, toUserId→toId, status→isSelf/isRevoked, createTime→sendTime）；③2.1 补全 isFollow 字段；④2.13 refresh-token 认证要求修正为无需认证 | ✅ 已完成 |
| v6.2.0 | 2026-09-30 | 用户字段与映射对齐修正：①2.1 用户信息响应字段修正（gender→sex, region→city, 删除 followCount, 补全 giftBalance/isDaRen/isManager/userStatus/description）；②2.2 请求体 signature→description；③2.3 关注请求体 userId→targetUserId+action；④18.1 用户字段映射表补全 8 个遗漏字段；⑤sex 映射说明修正为直接传数字 | ✅ 已完成 |
| v6.1.0 | 2026-09-30 | 与《后端开发文档》《后端功能拆解开发指导》对齐修正：①17.1 连接地址由错误的 `/chat` 命名空间修正为默认命名空间 `/`；②17.2 客户端事件补全至 19 个（新增 room_message/join_room/leave_room/typing/revoke_message/p2p_* 等），17.3 服务端事件补全至 21 个并对齐实际载荷；③19.3 数据库配置修正：聊天消息实际存 MySQL（xn_chat_log），MongoDB 模型为预留未使用；④补充章节跳号（10/19）说明 | ✅ 已完成 |
| v6.0.0 | 2026-09-30 | API 端点全量补全：新增管理后台模块（/api/admin + /api/admin-manage，100+ 端点）、项目管理模块（/api/project，9 端点）、钱包模块（/api/wallet，7 端点）；扩充其他模块 16.6-16.12（banner/splash/config/download/search/notice/feedback）；增补 chat 房间管理、circle 分享/转发、games 详情/搜索/评价/统计、user check-follow/refresh-token、pay redeem-key、report detail、reserve detail 共 19 端点；修正 tag/virtualUser 管理员权限标注、report 可选认证标注 | ✅ 已完成 |
| v5.9.0 | 2026-08-02 | 存储与带宽优化：新增前端直传 COS 流程（/api/upload/token、/api/upload/register）、统一媒资表 xn_media_asset 与级联删除；相册/聊天/动态接入直传；COS 访问签名 URL 防盗刷；动态删除接口；P2P 热内容取回流骨架（/api/p2p/peer-online 与 socket 信令） | ✅ 已完成 |
| v5.8.0 | 2026-07-15 | 新增WebRTC双通道信令事件、TRTC房间管理和计费接口、支付模块扩展接口；移除不存在的接口（unfollow、album/detail、album/unlock、upload/file、upload/token）；修正chat/mark-read路径；更新call_invite数据结构 | ✅ 已完成 |
| v5.7.2 | 2026-05-23 | 添加测试规范、完成一致性测试验证 | ✅ 已完成 |
| v5.7.1 | 2026-05-23 | 统一字段命名、移除活动/团队模块 | ✅ 已完成 |
| v5.7.0 | 2026-05-20 | 初始版本 | ✅ 已完成 |