# 多客陪玩 - 后端 API 接口文档

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
    "nickName": "小雪",
    "avatar": "https://picsum.photos/200/200",
    "level": 28,
    "vip": 1,
    "vipLevel": 3,
    "vipExpireTime": 1717209600,
    "gender": "female",
    "region": "北京",
    "balance": 500000.00,
    "score": 12500,
    "followCount": 128,
    "fansCount": 256,
    "status": 0,
    "createTime": 1704067200,
    "lastLoginTime": 1715040000
  }
}
```

### 2.2 更新用户信息

- **接口**: `POST /api/user/update`
- **认证**: 需要
- **请求体**: 
```json
{
  "nickName": "新昵称",
  "avatar": "url",
  "sex": 1,
  "city": "北京",
  "signature": "个性签名"
}
```
- **响应**: `{ "code": 200, "message": "更新成功" }`

### 2.3 关注用户

- **接口**: `POST /api/user/follow`
- **认证**: 需要
- **请求体**: `{ "userId": 123 }`
- **响应**: `{ "code": 200, "message": "关注成功" }`

### 2.4 取消关注

- **接口**: `POST /api/user/unfollow`
- **认证**: 需要
- **请求体**: `{ "userId": 123 }`
- **响应**: `{ "code": 200, "message": "取消关注成功" }`

### 2.5 获取粉丝列表

- **接口**: `GET /api/user/fans`
- **认证**: 需要
- **参数**: `?page=1&pageSize=20`
- **响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      { "userId": 123, "nickName": "用户A", "avatar": "url", "level": 10 }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2.6 获取关注列表

- **接口**: `GET /api/user/follows`
- **认证**: 需要
- **参数**: `?page=1&pageSize=20`
- **响应**: 与粉丝列表格式相同

### 2.7 发送短信验证码

- **接口**: `POST /api/user/send-sms`
- **认证**: 不需要
- **限流**: `smsLimiter`
- **请求体**: `{ "mobile": "13800138000" }`

### 2.8 手机号登录

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
    "nickName": "小雪"
  }
}
```

### 2.9 账号密码登录

- **接口**: `POST /api/user/login`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "username": "xxx", "password": "xxx" }`

### 2.10 注册

- **接口**: `POST /api/user/register`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "phone": "13800138000", "password": "xxx", "code": "1234" }`

### 2.11 重置密码

- **接口**: `POST /api/user/reset-password`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "phone": "13800138000", "password": "xxx", "code": "1234" }`

### 2.12 第三方登录

- **接口**: `POST /api/user/login-third`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "platform": "wechat", "openId": "xxx" }`

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
        "roomId": 1,
        "targetUserId": 123,
        "nickName": "用户A",
        "avatar": "url",
        "lastMessage": "你好",
        "lastMessageTime": 1715040000,
        "unreadCount": 2
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
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
        "messageId": "xxx",
        "fromUserId": 1,
        "toUserId": 123,
        "content": "你好",
        "type": 0,
        "mediaUrl": "",
        "duration": 0,
        "status": 1,
        "createTime": 1715040000
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
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

- **接口**: `POST /api/chat/read`
- **认证**: 需要
- **请求体**: `{ "targetUserId": 123 }`

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

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/gift/admin/withdraw/list` | GET | 提现列表 |
| `/api/gift/admin/withdraw/approve` | POST | 审核通过 |
| `/api/gift/admin/withdraw/reject` | POST | 审核驳回 |

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
| `/api/pay/validate-card` | POST | 验证卡券 |
| `/api/pay/use-card` | POST | 使用卡券 |

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

## 11. 音视频通话模块 (`/api/trtc`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/trtc/auth` | GET | 需要 | 获取TRTC签名 |
| `/api/trtc/start` | POST | 需要 | 发起通话 |
| `/api/trtc/cancel` | POST | 需要 | 取消通话 |
| `/api/trtc/reject` | POST | 需要 | 拒绝通话 |
| `/api/trtc/accept` | POST | 需要 | 接受通话 |
| `/api/trtc/end` | POST | 需要 | 结束通话 |
| `/api/trtc/history` | GET | 需要 | 通话记录 |

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
| `/api/album/list` | GET | 需要 | 获取相册列表 |
| `/api/album/detail` | GET | 需要 | 获取照片详情 |
| `/api/album/upload` | POST | 需要 | 上传照片 |
| `/api/album/delete` | POST | 需要 | 删除照片 |
| `/api/album/like` | POST | 需要 | 点赞照片 |
| `/api/album/unlock` | POST | 需要 | 解锁付费照片 |

---

## 14. 标签管理模块 (`/api/tag`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/tag` | GET | 需要 | 获取所有标签 |
| `/api/tag` | POST | 需要 | 创建标签 |
| `/api/tag/:id` | GET | 需要 | 获取标签详情 |
| `/api/tag/:id` | PUT | 需要 | 更新标签 |
| `/api/tag/:id` | DELETE | 需要 | 删除标签 |
| `/api/tag/defaults` | GET | 需要 | 获取默认标签 |
| `/api/tag/recommend` | GET | 需要 | 推荐标签 |
| `/api/tag/category/:category` | GET | 需要 | 按分类获取 |
| `/api/tag/init-defaults` | POST | 需要 | 初始化默认标签 |
| `/api/tag/:tagId/users` | GET | 需要 | 标签下的用户 |
| `/api/tag/assign` | POST | 需要 | 分配标签 |
| `/api/tag/remove` | POST | 需要 | 移除标签 |
| `/api/tag/user/:virtualUserId` | GET | 需要 | 用户拥有的标签 |
| `/api/tag/set-primary` | POST | 需要 | 设置主要标签 |

---

## 15. 虚拟用户模块 (`/api/virtual-user`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/virtual-user` | GET | 需要 | 虚拟用户列表 |
| `/api/virtual-user` | POST | 需要 | 创建虚拟用户 |
| `/api/virtual-user/:id` | GET | 需要 | 虚拟用户详情 |
| `/api/virtual-user/:id` | PUT | 需要 | 更新虚拟用户 |
| `/api/virtual-user/:id` | DELETE | 需要 | 删除虚拟用户 |
| `/api/virtual-user/:id/status` | POST | 需要 | 切换在线状态 |
| `/api/virtual-user/:virtualUserId/chat` | POST | 需要 | AI聊天 |
| `/api/virtual-user/:virtualUserId/history` | GET | 需要 | 聊天历史 |
| `/api/virtual-user/:virtualUserId/context` | DELETE | 需要 | 清除上下文 |

---

## 16. 其他模块

### 16.1 上传模块 (`/api/upload`)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload/image` | POST | 上传图片 |
| `/api/upload/audio` | POST | 上传音频 |
| `/api/upload/video` | POST | 上传视频 |

### 16.2 举报模块 (`/api/report`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/report` | POST | 需要 | 提交举报 |
| `/api/report/list` | GET | 管理端 | 举报列表 |
| `/api/report/handle` | POST | 管理端 | 处理举报 |

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

---

## 17. WebSocket 实时通讯

### 17.1 连接

- **地址**: `/chat`
- **认证**: 通过 `auth.token` 参数传递 JWT

### 17.2 客户端事件

| 事件 | 说明 | 数据 |
|------|------|------|
| `private_message` | 发送私聊消息 | `{ toId, content, type, mediaUrl, duration }` |

### 17.3 服务端事件

| 事件 | 说明 | 数据 |
|------|------|------|
| `private_message` | 接收私聊消息 | `{ fromId, content, type, mediaUrl, duration, timestamp }` |
| `private_message_ack` | 消息送达回执 | `{ messageId, status }` |
| `typing` | 对方正在输入 | `{ userId }` |
| `message_revoked` | 消息被撤回 | `{ messageId }` |
| `call_invite` | 通话邀请 | `{ roomId, userId, type }` |
| `call_cancel` | 通话取消 | `{ roomId }` |
| `call_reject` | 通话被拒 | `{ roomId }` |
| `call_accept` | 通话接受 | `{ roomId }` |
| `call_end` | 通话结束 | `{ roomId, duration }` |

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
| `sex` | TINYINT | 性别 | gender (1->male, 2->female) | ✅ 一致 |
| `city` | VARCHAR | 城市 | city | ✅ 一致 |
| `money` | DECIMAL | 金币余额 | balance | ✅ 一致 |
| `score` | INT | 积分 | score | ✅ 一致 |
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

- **MySQL**: 用户、订单、游戏、礼物、团队、需求、相册等核心业务数据
- **MongoDB**: 聊天消息、通知、用户会话等非结构化数据
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
| 分支覆盖率 | 50% | 条件分支覆盖 |
| 函数覆盖率 | 50% | 函数定义覆盖 |
| 行覆盖率 | 50% | 代码行覆盖 |
| 语句覆盖率 | 50% | 语句覆盖 |

---

## 22. 文档版本历史

| 版本 | 日期 | 更新内容 | 状态 |
|------|------|----------|------|
| v5.7.2 | 2026-05-23 | 添加测试规范、完成一致性测试验证 | ✅ 最新 |
| v5.7.1 | 2026-05-23 | 统一字段命名、移除活动/团队模块 | ✅ 已完成 |
| v5.7.0 | 2026-05-20 | 初始版本 | ✅ 已完成 |