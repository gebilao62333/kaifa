# eu搭子 - 后端 API 接口文档

> 版本: v6.50.0
> v6.50.0 变更（2026-10-21，剩余批次修复）: **新增换绑手机号与用户搜索，资料/入驻扩展字段**。①新增 `POST /api/user/change-mobile/send-code`（一次请求给当前手机号发 `bind_old` 码、给新手机号发 `bind_new` 码；非生产回传 `devCodes`）与 `POST /api/user/change-mobile`（双码校验 + 新号盲索引查重 + 吊销全部会话 + 原子换号，返回 `requireRelogin:true`）；②新增 `GET /api/search/users`（可选登录，昵称模糊搜索，遵守“允许被搜索”隐私开关）；③ `GET /api/user/get` 返回 `profileExtra`（生日/身高/职业/爱好/擅长游戏/主页背景/标签公开，微信/邮箱仅本人）且 `POST /api/user/update` 接受 `profileExtra`；④ `POST /api/games/apply` 接受并落库 `city/skillLevel/zone/position/playType`，`my-services`/`companions`/`companions/:id` 按需返回；⑤ `POST /api/circle/*` 标签/图片契约见 v6.49.0；⑥ 管理端审核口径修正：`/api/admin/companion-applications/:id/approve` 写 `status=2`（接单中/通过）、`reject` 写 `status=0`（未通过，可重新申请），并补 `approve_time/reject_reason` 列，响应字段不变。
> 版本: v6.49.0
> v6.49.0 变更（2026-10-21，页面功能检查修复批）: **响应字段与广场标签能力补齐，无路径/状态码变化**。① `GET /api/user/get` 仅当查询本人时新增 `mobile`（脱敏 `138****8888`，查他人不返回）；② `GET /api/games/companions`、`GET /api/games/search` 列表项新增 `sex`（0 保密/1 男/2 女）；③ `GET /api/games/companions/:companionId` 新增 `sex` 与 `serviceType`（`online`/`offline`，驱动用户主页线下服务状态）；④ `GET /api/circle/tags` 不再硬编码返回空数组，改为读启用标签并按 `sort_order,id` 升序返回 `{ id, name, tagId, tagName, icon, sortOrder }`；⑤ `GET /api/circle/posts` 的 `tag` 参数兼容标签名称（数字按 tagId 精确匹配），名称为空/查不到时返回空列表；⑥ `GET /api/circle/post/:id`、`GET /api/circle/my-posts` 的 `images` 统一按 JSON 数组/逗号分隔两种历史格式解析。
> 版本: v6.48.0
> v6.48.0 变更（2026-10-20）: **微信支付扫码链路（NATIVE）+ 未配置语义**。①`POST /api/pay/wx-order` 新增可选 `tradeType`（`NATIVE` 默认 / `JSAPI` 需 `openid`），响应新增 `tradeType/codeUrl`；NATIVE 走微信统一下单 `trade_type=NATIVE` 并回传真实 `code_url` 供前端渲染二维码；②未配置微信商户参数时返回 **503**，与业务错误 422 区分；③客户端不再需要伪造回执：入账仍只认 `/wx-notify`（微信服务端）或 `/wx-callback`（服务端反查）——客户端的 `/wx-callback` 调用已从支付页移除；④支付宝渠道后端未实现，充值页隐藏该入口。
> 版本: v6.47.0
> v6.47.0 变更（2026-10-20）: **动态可见范围语义补齐 + 预约时段管理补参**。①`POST /api/circle/create` 的 `visibility` 上限由 3 放宽到 **4**：0 公开 / 1 仅关注 / 2 私密 / 3 密码查看 / 4 付费查看（落库 `xn_post.is_private`：0/3/4/1/2，1/2 沿用历史值）；②`GET /api/circle/posts`、`GET /api/circle/search/posts` 按可见范围过滤（公开 + 自己 + 已关注作者的仅关注；私密仅作者）；`GET /api/circle/post/:id` 对无权查看的仅关注/私密返回锁定占位（`privateType=3/4`）；`POST /api/circle/repost` 仅允许公开动态；③`GET /api/circle/comments` 对无权查看的动态返回 **403**；④`GET /api/reserve/slots` 新增 `includeDisabled=1`，管理端可同时拿到已关闭（status=2）时段，用户端不传时仍只返回可约（status=0）。
> 版本: v6.46.0
> v6.46.0 变更（2026-10-20）: **文档整治——合并《后端交互功能梳理》《后端功能拆解开发指导》独有内容；仅 §17 事件表变化，REST 契约零变更**。①§17.2/§17.3 按代码实况校正：删除从未实现的 room_message/join_room/leave_room 及服务端回执 room_message_ack/join_room_success/leave_room_success；补入 v6.35 已实现的 message:read 与 v6.38 公告全服事件 notice_created/notice_updated/notice_deleted；②message:read 的 destroyAt 由服务端夹取到 (now, now+300]，非法值置 0（销毁事实仍以 read_at/destroy_at 列 + 清理器为准）；③本轮不改任何 REST 路径/请求体/响应体/状态码，前端无需发版。原两份文档独有内容已并入《后端开发文档》6.7 与附录 A，原文 2026-10-20 起归档。
> v6.45.0 变更（2026-10-20）: **兼容端点盘点与废弃标注（行为零变更）**——管理端 9 组旧兼容别名、`POST /api/admin-manage/login`、`POST /api/pay/pay/create` 在代码注释与新增 **22.21 兼容保留端点**表中标记 deprecated，写明替代端点与删除条件；本轮无路径/请求体/响应体变化。
> v6.44.0 变更（2026-10-20）: **管理端权限接口改为返回权限键真源**。`GET /api/admin-manage/permissions` 的 `data` 由「19 个模块 id 数组」改为 `{ modules, permissions }`：`modules` 保持旧结构（兼容侧边栏），`permissions` 返回 `utils/permissions.js` 的 `ALL_PERMISSIONS`（`模块:动作` 键 + 中文 label），管理端角色编辑器改为消费该字段，不再维护第二份硬编码键表。无其它接口变更。
> v6.43.0 变更（2026-10-20）: **新增「已登录修改密码」接口 + 管理端权限 403 可区分**。①`POST /api/user/change-password`（`authMiddleware`）：校验旧密码，新密码 6~32 位；改库前先吊销该账号全部会话（与 2.10 重置密码同口径），响应 `data.devicesRevoked`；②`requirePermission` 的 403 响应新增 `error: "PERMISSION_DENIED"` 字段——管理端据此区分「权限不足」与「账号/令牌失效」，前者不再清本地登录态；③其余接口路径/请求体/响应不变。
> v6.42.0 变更（2026-10-20，B-7）: **手机号加密存储 + 盲索引**（登录/注册/找回等接口契约不变，仅落库与查询方式变化）：①`xn_user.mobile` 改为 AES-256-GCM 密文，新增 `mobile_hash` 唯一盲索引（迁移 `20261020000003_encrypt_mobile.js`，第 15 步）；②`POST /api/user/login`、`login-mobile`、`register`、`reset-password` 行为不变——服务端内部改用 `mobile_hash` 等值查询；③**管理端 `GET /api/admin/users?phone=` 由模糊匹配改为精确匹配**（密文无法 LIKE，需传完整 11 位手机号），响应里的 `phone` 仍是解密后的明文；④C 端用户信息接口本就不返回手机号，无变化。`
> 版本: v6.41.0
> v6.41.0 变更（2026-10-20，B-13 尾项）: **通话与圈子写接口入参统一校验**（契约加严，路径/成功响应不变，非法入参统一 400）：①`POST /api/trtc/{start,cancel,reject,accept,end,room/create,room/enter,room/leave,billing/start,billing/end}`：`calleeId`/`callId`/`roomId`/`billingId` 为 1~INT_MAX 整数（数字字符串会被归一），`callType` 1~3、`orderId` 允许 0；②`POST /api/circle/{create,unlock,delete,like,comment,share,repost}`：`postId` 必填、评论 `content` 1~1000、`visibility` 0~3、`price` ≥0、`password`≤64；数组字段（images/videos/tagIds）仍由控制器归一。至此 `chat/games/reserve/trtc/circle` 写接口全部在路由层收口。
> v6.40.0 变更（2026-10-20，B-13）: **聊天/陪玩/预约写接口入参统一校验**（契约加严，路径/成功响应不变，非法入参由各控制器零散判空改为路由层统一 400）：①`POST /api/chat/send` 要求 `targetUserId`(int≥1)、`content`(1~2000)，`type` 0~10、`mediaUrl`≤512、`duration` 0~3600；`/revoke` `messageId` 必填、`/mark-read` `targetUserId` 必填；②`POST /api/games/{push,grab,start,complete,cancel,apply,evaluate,appeal,toggle-service}`：ID 类必填且 1~INT_MAX，`num` 1~100、`price`/(0,1e8]、`rating` 1~5、`role` ∈ {user,companion}、文本长度限制；③`POST /api/reserve/{create,confirm,reject,cancel,complete,slots/toggle,slots/batch}`：`companionId`/`reserveId`/`slotId` 必填，`date`/`time` ≤20 字符、`gameId` 允许 0（未选游戏）、`reason`≤500。**未覆盖**：`/api/trtc/*` 与 `/api/circle/*` 写接口（下一批）。
> v6.39.0 变更（2026-10-20，B-10/B-12）: **卡密密码加密存储 + 管理端列表分页校验**。①B-10：`xn_card.card_password` 改为 AES-256-GCM 密文落库（迁移 `20261020000001_encrypt_card_password.js`，宽列 50→255 + 存量加密，`runMigrations` 第 13 步），**接口契约不变**——`GET /api/admin/cards` 与发卡响应仍返回可用明文（服务端解密后下发），`POST /api/pay/validate-card|use-card` 行为不变；②B-12：管理端全部列表 GET 统一挂 `validateQuery`，`page` 1~100000、`pageSize` 1~100（超界 400）。
> v6.38.0 变更（2026-10-20，B-3/B-4）: **公告落库 + 全服实时推送**——①新增迁移 `20261020000000_add_notice.js`（`xn_notice`，已接线 `runMigrations` 第 12 步）；②`GET /api/notice/list` 改为读库，响应由 `{ list }` 变为 `{ list, pagination }`，只返回已发布且在 `[start_time,end_time]` 有效期内的公告（表未迁移时降级空列表，不 500）；③新增后台 `GET/POST /api/admin/notices`、`GET/PUT/DELETE /api/admin/notices/:id`（权限沿用 `splash:read`/`splash:write`）；④新增 socket 全服事件 `notice_created`/`notice_updated`/`notice_deleted`（服务端 `broadcastToAll` 触发，广播失败不影响落库）。`
> 版本: v6.37.0
> v6.37.0 变更（2026-10-20，B-2）: **新增后台实名审核接口**——`GET /api/admin/real-names`（分页/状态/关键词）、`GET /api/admin/real-names/:id`（含证件照）、`PUT /api/admin/real-names/:id/review`（approve/reject）。审核通过把 `real_name_status` 1/3 → 2 并在**同一次**状态迁移中发放实名经验（`EXP_SOURCES.real_name_verified=100` × VIP 倍率），条件更新保证并发只发一次；已认证再次审核 409。C 端 `POST /api/user/real-name` 现在对已认证账号返回 400「已完成实名认证，无需重复提交」。`
> 版本: v6.36.0
> v6.36.0 变更（2026-10-20）: **管理端 refresh 令牌闭环 + 3 处契约加严**。①新增 `POST /api/admin/refresh-token`（B-5），`POST /api/admin/login` 现在同时下发 `refreshToken`/`expiresIn`；②`GET /api/gift/redpacket/history`（B-11）新增 `page/pageSize`，响应由数组改为 `{ list, pagination }`；③`POST /api/games/evaluate`（B-14）业务错误分流为 409/400，不再一律 500；④`GET /api/games/orders`（B-15）列表项新增 `pingjiaStatus`/`rated`/`star`；⑤socket `revoke_message`（B-16）改为「已落库撤回」才转发。
> v6.35.0 变更: 已读自动销毁服务端化 + 聊天消息级举报——**新增字段与 1 个举报类型，路径/请求体不变**。①`POST /api/chat/mark-read` 响应新增 `destroyAt`，服务端在标记已读时按**发送方**的 `privacy.autoDestroy`（20/30/60 秒）写入 `read_at`/`destroy_at`；②`GET /api/chat/messages` 每条消息新增 `readAt`/`destroyAt`，到期后不再返回该消息（读侧兜底，清理器 60 秒内落库 `is_del=1` 并清内容/回收媒体）；③socket `message:read` 负载新增 `destroyAt`（服务端夹取到 now+300 内，仅 UI 提示）；④`POST /api/report` 支持 `targetType=4`（聊天消息）：举报后**冻结该消息的自动撤回/销毁期限**，保证管理员可核查
> v6.34.0 变更: 时间自动撤回服务端化——**新增 1 个响应字段，路径/请求体不变**。①`POST /api/chat/send` 响应新增 `expireAt`（到期撤回时间戳，0=不自动撤回）；②`GET /api/chat/messages` 每条消息新增 `expireAt`，已到期（含清理器未扫到）的消息按已撤回下发（`isRevoked: true`、`content` 空串、`mediaUrl` 为 `null`）；③socket `private_message` / `private_message_ack` 负载新增 `expireAt`；④撤回期限来自用户偏好 `xn_user_pref.data.privacy.autoRecall`（秒，上限 300），由 `POST /api/user/pref` 写入
> v6.33.0 变更: 撤回语义收口（手动撤回刷新丢失 + 原文残留）——**接口契约不变，语义加严**。①`POST /api/chat/revoke`：通过校验后除置 `is_revoked=1` 外**清空 `content`**，媒体消息同时清空 `vod_url` 并删除媒资登记；②`GET /api/chat/messages`：`is_revoked=1` 的消息不再下发原文与媒体地址（`content` 为空串、`mediaUrl` 为 `null`）；③撤回拦截类型由 `3/4` 更正为 `6/7`（礼物/红包），视频（3）与位置（4）恢复可撤回；④订正 3.2 消息类型表。
> v6.32.0 变更: 文档维护——移除已废弃等级权益的过时记载，权益口径统一为《数据库设计文档》4.1.2 的 7 项真实门槛（唯一口径 `backend/src/utils/level.js`）。**本轮无接口/代码变更**，不影响任何路由、请求体或响应。
> v6.31.0 变更: 安全扫描「低危项 + 依赖」打包收口——**接口契约基本零变更，仅登录失败载荷收敛**。①`POST /api/user/login` 的凭证类失败（用户不存在 / 密码错误 / 该用户未设置密码）此前分别返回不同 `message` 与按字段定位的 `errors`，现统一为同一 **422** 与同一文案「手机号或密码错误」、`errors` 为空对象 `{}`——用于消除「手机号是否已注册」的账号枚举 oracle（与 C-3 卡密枚举同源）。成功登录的响应体与状态码不变。②`GET /api/health` 的 503（unhealthy）分支**不再回传 `error: e.message`**，载荷固定为 `{ code:503, message:'unhealthy', data:{ status:'unhealthy' } }`（依赖异常只落服务端日志）。③其余改动均不在接口面：JWT 验签固定 `algorithms:['HS256']`（无接口变化）、`/api/health` 之外的错误响应不变、基础镜像与前端 `window.open`/socket 地址属部署与前端内部。其余路由/参数/成功载荷/状态码均不变。详见《后端开发文档》v6.29、《后端交互功能梳理》发现清单第 34 条
> v6.30.0 变更: ALLOW_INSECURE_CONFIG 一键跳过生产校验改为按项豁免（安全扫描 M-13）——**接口契约零变更**。本轮只改 `server.js` 的**启动期**生产配置校验逻辑（新增纯函数 `src/utils/startupConfigGuard.js` 的 `parseInsecureConfigWaivers`）与四份 `.env*.example`/《部署文档》的注释，不新增/删除/修改任何路由、请求参数、响应体或状态码，所有 REST 与 Socket.IO 接口的运行时行为不变。唯一的运维可见差异在**启动阶段**：`ALLOW_INSECURE_CONFIG=true`（及 `1/yes/y/on/all/*`）不再整体跳过全部生产校验，须显式写成 `ALLOW_INSECURE_CONFIG=<检查项名>`（逗号分隔，可豁免 JWT_SECRET / DB_PASSWORD / ADMIN_TOKEN / ADMIN_JWT_SECRET / PII_ENCRYPTION_KEY）才逐项放行，且 CORS_ORIGIN / USE_MOCK_DB / RATE_LIMIT_DISABLED 无豁免途径——配错会导致**进程拒绝启动**（非任何接口返回变化）。详见《后端开发文档》v6.28、《后端交互功能梳理》发现清单第 33 条
> v6.29.0 变更: multer 1.x 停维护升级 2.x（安全扫描 M-12）——**接口契约零变更**。本轮只改依赖版本（`backend/package.json` + `package-lock.json`：multer 1.4.5-lts.2 → 2.4.0）与上传落盘后缀的生成方式（`src/config/upload.js` 改用新增的 `src/utils/uploadFileNaming.js`），不新增/删除/修改任何路由、请求参数、响应体或状态码；`POST /api/upload/image|audio|video` 的入参字段名（`image`/`audio`/`video`）与返回结构不变。行为差异仅在非法后缀场景：客户端文件名带可执行后缀（如 `.html`）而 MIME 伪造为图片时，落盘后缀被强制回退为 mimetype 规范后缀（`image/jpeg → .jpg`，此前会原样落 `<uuid>.html`），最终仍由 service 层白名单拒绝并回 400「不支持的图片格式」。详见《后端开发文档》v6.27、《后端交互功能梳理》发现清单第 32 条
> v6.28.0 变更: 社交关系隐私收口（安全扫描 M-11）——**两条社交关系读接口与一条在线探测接口的鉴权口径变更，前端零代码改动**。①`GET /api/user/fans?userId=` 与 `GET /api/user/follows?userId=`：此前 `userId` 缺省取本人、传入他人 ID 即返回**他人**的粉丝/关注列表（任意登录用户可拉取任何人社交关系图）。现改为**只允许本人**：不传或传本人 ID = 正常返回；显式传**他人** ID → **403**「无权查看他人社交关系」；`userId` 非法格式（非十进制正整数）→ **400**。②`GET /api/p2p/peer-online?peerId=`：此前任何登录用户可探测任意用户的在线状态（批量在线枚举）。现改为**仅本人，或与本人已存在会话（`xn_chat_room`）/聊天记录（`xn_chat_log`）的对端**可探测，否则 **403**「无权探测该用户在线状态」（且不透露在线与否）。**调用方须知**：C 端 `Fans.vue`/`Follows.vue` 从不传 `userId`、`UserProfile.vue` 只显示计数不拉列表、`p2pFetchService.checkPeerOnline` 对非 200 返回 false 并回退常规直连——**均无需前端发版**；仅影响「主动用他人 ID 调这两类读接口」的非官方调用方。📌 详见《后端开发文档》v6.26、《后端交互功能梳理》发现清单第 31 条
> v6.27.0 变更: P2P 热内容取回信令字段校验（安全扫描 M-10）——**REST 接口路径、请求体、成功响应、错误码体系全部未变；本轮改的是 Socket.IO 的 P2P 信令转发面**。此前 `p2p_fetch_request`/`p2p_fetch_response`/`p2p_offer`/`p2p_answer`/`p2p_ice_candidate` 五个事件把客户端上报的 `toId`/`requestId`/`url`/`fallbackUrl`/`payload` 原样转发给目标 `user:` 房间，零校验——任何登录用户可指定「任意目标用户 + 任意 URL」，令对方浏览器 `fetch` 内网/回环/云元数据地址（SSRF）或外链钓鱼。现服务端在转发前校验：`toId` 须为正整数且非自身、`requestId` 须为安全字符集且 ≤64、`url`/`fallbackUrl` 须为指向「平台自有存储主机白名单」（站点域名 + COS/七牛/OSS 域名）的 http(s) 地址（相对路径按站点域名补全）、`offer`/`answer`/`candidate`/`payload` 序列化 ≤64KB、`type` 限 `image`/`video`/`audio`/`file`。**调用方须知**：合法 P2P 信令的**载荷字段与语义零变化**，无需前端发版；唯一可观察差异是「非法/越界信令被服务端丢弃」（不再转发），客户端本就以超时回退常规直连兜底。📌 详见《后端开发文档》v6.25、《后端交互功能梳理》发现清单第 30 条
> v6.26.0 变更: Nginx 安全响应头继承修复（安全扫描 M-9）——**接口路径、请求体、成功响应、错误码体系全部未变，无任何 API 契约变更**。本项是部署层（`nginx/`）配置修复：nginx 的 `add_header` 不合并继承，任一 `location`/`server` 自带一条 `add_header` 就会丢弃上层全部安全头，导致 `/uploads/*` 与 `/admin*` 上的 `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`/`Content-Security-Policy` 丢失（443 下 `/uploads/`、`/admin` 连 HSTS 也丢）。修复后这些路径的**响应头**恢复下发（CSP 的 `script-src 'self'` 等可能影响前端资源加载策略，调用方若曾依赖「无 CSP」的空档需注意）。**调用方须知**：接口**请求/响应体零变化**，无需前端发版；唯一可观察差异是上述静态/代理路径的响应头补齐，以及 443 站点 `X-Frame-Options` 由 `DENY` 调整为 `SAMEORIGIN`（与 CSP `frame-ancestors 'self'` 一致）。详见《后端开发文档》v6.24、《部署文档》v6.19。
> v6.25.0 变更: 实名信息静态加密与口令列收口（安全扫描 M-8 修复）——**接口路径、请求体形态、成功响应结构、错误码体系均未变**，改的是「实名四字段的落库形态」与「密码列的默认可见性」，另新增一条启动期强制配置。①**实名提交 `POST /api/user/real-name`**：请求体不变（`realName/idCard/front/back`），但服务端落库前经 `utils/pii.js` 的 `encryptField` 加密（AES-256-GCM，密钥 `PII_ENCRYPTION_KEY`），成功响应结构不变；生产环境未配置 `PII_ENCRYPTION_KEY` 时**服务直接拒绝启动**（`server.js` 致命项），非生产未配置时回落明文并只告警一次。②**实名状态 `GET /api/user/real-name/status`**：响应字段不变（`status/realName/idCard/time`），`realName/idCard` 仍为**脱敏**值（服务端先 `decryptField` 解密再做 `*` 替换），只是数据源由「明文列」变为「解密后的列」。③**`xn_user.password` 默认不可见**：`User` 模型新增 `defaultScope` 排除 `password`，任何返回用户对象的接口（用户信息、资料、列表等）**天然不再携带口令哈希**；登录与改密内部经 `User.scope('withPassword')` 取回，属服务端内部行为，**响应体无变化**。④**表结构**：`xn_user` 的 `real_name`(50→255)/`id_card`(18→255)/`real_name_front`(255→512)/`real_name_back`(255→512) 四列加宽以容纳密文，对应**手动迁移** `src/migrations/20261004000002_widen_pii_columns.js`（不自动执行，须在配置加密键前手工跑，否则密文被截断）。**遗留（如实标注）**：`mobile` 仍明文存储（登录/注册的 `unique` 查号键，加密需先引入盲索引，本轮不改）；存量实名明文数据未回填（新写加密、旧明文可读，不做强制迁移）；无密钥轮换机制（换键即旧密文不可解）。📌 **调用方须知**：本版本**无需前端发版**——请求/响应契约零变化，前端 `RealName.vue` 的提交与回显逻辑完全兼容。
> v6.24.0 变更: 红包并发超额发放收口（安全扫描 M-7 修复）——**接口路径、请求体形态、成功响应、错误码分类均未变**（领取成功仍 200 + `data.amount`），改的是**领取时的并发语义与字段名契约**：①**根因**——`POST /api/gift/redpacket/receive` 原来**先在事务外读红包**，用事务外读到的（可能过期的）`remain_amount` 为拼手气红包取随机金额，**再**开事务用「`remain_num > 0`」的条件更新占用名额：并发领取时多个请求各自基于**同一个旧余额**取随机金额，累计入账可超过 `total_amount`（原 `GREATEST(remain_amount - amount, 0)` 只把剩余额夹到 0，**不会收回已经记入用户钱包的钱**）。②**修复**——领取改为**整个流程一个事务**，进入后立即 `SELECT ... FOR UPDATE` **锁定红包行**（`RedPacket.findOne({ where:{packet_no}, transaction, lock })`），把同一红包的领取**串行化**；后到的请求拿到行锁后才读到已被扣减的 `remain_num`/`remain_amount`，**按最新余额分配**，保证累计发放恰好等于 `total_amount`。金额一律以「分」为单位计算（`remainCents`），拼手气区间为 `[1, remainCents-(remainNum-1)]`（给其余每人至少留 1 分），**最后一人（`remainNum===1`）拿走剩余全部**（否则零头会随红包关闭 `remain_amount 置 0` 凭空消失）；普通红包 `floor(remainCents/remainNum)` 均分、不足部分留给最后一人。状态/有效期/不能领自己/重复领取四项校验也移入事务内（重复领取仍靠 `(packet_id,user_id)` 唯一索引兜底）。③**入参校验与字段名对齐**——`/api/gift/redpacket/receive` 现挂 `validate`：`packetNo` **必填字符串**（1~64 字符），空/缺失回 400「packetNo是必填字段」；同时修掉 M-6 登记的历史缺陷——前端 `giftService.receiveRedPacket` 原提交 `packetId` 而后端读 `packetNo`（**后端以 `packetNo` 为准**，聊天气泡与 e2e 脚本都用 `packetNo`），前端方法已改传 `packetNo`。**行为变更**：并发抢同一拼手气红包不再超发（原先可被刷出多于 `total_amount` 的金额）；普通红包的零头改由最后一名领取者获得（原实现零头随红包关闭被清零、少发）。**遗留**：①C 端「领取红包」入口仍未接线——`ChatRoom.vue` 的红包气泡**没有点击领取的处理函数**，`frontend/src/services/giftService.js` 的 `receiveRedPacket` 在全仓库**无调用方**（本接口此前只能被直接调用），本次只收口服务端并发与契约，**未新增前端领取交互**；②红包记录接口 `GET /api/gift/redpacket/history` 未分页。本轮改写 `tests/unit/services/giftService.test.js` 的 `receiveRedPacket` describe（新增锁定、普通红包零头、拼手气预留、最后一人取全、名额为 0、唯一索引冲突等用例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.22
> v6.23.0 变更: 写接口统一入参校验（安全扫描 M-6 修复）——**接口路径、成功响应与错误码体系（400/401/403/422/500）未变**，但**10 个金额/资金写接口的请求体边界从「controller 零散兜底」升级为「中间件统一校验」**：`middlewares/validation.js` 此前仅被 re-export、**零挂载**，写接口只靠 controller 里的 `if (!x)` + `parseFloat/parseInt`，负数、超大数与「类型绕过」无统一防线。本轮加固中间件并在下列接口挂载 `validate`（均挂在鉴权中间件之后，未鉴权请求仍先回 401/403）：`POST /api/wallet/withdraw`（`amount` 正有限数字 0.01~1e8、`type` 整数 ∈ 1/2/3、`account`≤255/`name`≤50/`image`≤255/`bank`≤255 字符）、`POST /api/gift/send`（`receiverId`/`giftId` 必填整数、`roomId` 整数、`count` 整数 1~1e8）、`POST /api/gift/withdraw`（`money` 正有限数字、`type` 整数 1~3）、`POST /api/gift/redpacket/send`（`totalAmount` 正有限数字、`totalNum` 整数 1~100、`type` 整数 ∈ 0/1、`message`≤100 字符、`roomId`/`receiverId` 整数）、`POST /api/pay/create-order`、`POST /api/pay/wx-order`、`POST /api/pay/pay/create`（`packageId` 必填整数 1~2147483647）、`POST /api/vip/order`（`packageId` 必填整数）、`POST /api/pay/wallet/recharge`（管理端，`amount` 正有限数字、`userId` 整数）、`POST /api/admin/withdraws`（管理端，`userId` 整数、`amount` 正有限数字）。**校验语义**：数字/整数字段只接受 JSON number 或**纯十进制字符串**（`"100"`/`"100.5"`，含表单提交），并归一化为数字后回写——**科学计数法/十六进制/千分位（`"1e5"`/`"0x10"`/`"1,000"`）以及数组/对象/布尔冒充数字一律 400**（`parseFloat([100])===100`、`Number(true)===1` 这类「类型绕过」被封堵）；`min`/`max` 作用于归一化后的数值。**刻意不校验 `payType`**：客户端（含 `test_final.ps1`）会传字符串 `"alipay"`/`"wechat"`，controller 内部 `parseInt` 兜底，声明为整数会把既有正常下单变 400。**业务下限不变**：最低提现 100、红包 ≥1、礼物数量与余额的关系仍由服务层判定（中间件只拦类型与量级，超限/非法类型返回 400，业务不足仍为 422）。**遗留**：仅覆盖上述 10 个接口；分页 `GET` 的 `page`/`pageSize` 未挂 `validateQuery`；`POST /api/gift/redpacket/receive` 的「前端传 `packetId`、后端读 `packetNo`」字段名不一致未修；`/api/gift/withdraw` 的嵌套 `bankInfo` 未做长度校验。本轮扩展 `tests/unit/middlewares/validation.test.js`（新增 17 例，文件共 29 例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.21
> v6.22.0 变更: 短信验证码失败计数与非生产回传门槛（安全扫描 M-5 修复）——**接口路径、请求体、错误码一字未改**，改的是「试错次数」与「验证码何时出现在响应体里」：①**失败计数与作废**（此项已于 C-1/H-1 轮落地，本轮复核确认）——`POST /api/user/login-mobile`、`/register`、`/reset-password` 校验验证码时按「场景 + 手机号」在 Redis `sms:fail:*` 计数，达 `SMS_MAX_ATTEMPTS=5` 即删码并回「验证码错误次数过多，请重新获取」；此前 5 分钟有效期内可对 6 位码反复试；②**回传门槛收紧**：`POST /api/user/send-sms` 的响应体 `data.code`（开发环境回传、供前端自动回填）此前按 `nodeEnv !== 'production'` 回传，而 `NODE_ENV` 未设置时服务端会**静默按 `development` 处理**——生产机器漏配即把验证码交给调用方；现由 `config.sms.returnCodeInDev`（`= !生产 && NODE_ENV 已显式声明`）决定，**只有显式声明的非生产环境**（`development`/`test`/`staging`）才在 `data.code` 返回，`NODE_ENV` 未显式声明时该接口不再回传验证码、直接回 **422「短信服务未配置，请联系管理员」**（不落库、不静默成功）。**行为变更**：显式非生产的联调行为不变（仍回传 6 位码）；未设 `NODE_ENV` 的部署该接口由「回传验证码」变为「422 显式失败」（配合 H-8 的 NODE_ENV 启动告警）。**遗留**：失败计数仅在单码有效期内累计、无按手机号的日/小时级发码上限（短信轰炸不在本项）；回传开关是配置推导值、无独立环境变量。本轮新增 `tests/unit/services/smsDevReturn.test.js`（3 例）并在 `smsScene.test.js` 的 config mock 补 `returnCodeInDev: true`，因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.20
> v6.21.0 变更: 管理端令牌签名密钥与门禁声明收口（安全扫描 M-3 修复）——**接口路径、请求体/响应体、错误码一字未改**，改的是管理端令牌「用什么密钥签」与「校验时信什么」：①**管理端令牌改用独立签名密钥** `ADMIN_JWT_SECRET`（未配置时由 `JWT_SECRET` 经 HMAC 派生一个**不同**的密钥）——此前用户端与管理端共用 `JWT_SECRET`，令牌是不是管理端只看 payload 里可伪造的 `role==='admin'||role_id===1` 声明，属纵深防御缺失；分离后两类令牌互不通用、用错密钥的令牌在验签阶段即失败；②**`adminAuth` 不再采信 `role`/`role_id` 声明**——门禁改为「独立密钥 + `type=admin` 白名单」通过即可，主体合法性交给 M-2 的 `resolveLiveAdmin` 按 `adminScope` 回读数据库（无 `adminScope` 的历史令牌 → 401 强制重登）；③**固定令牌/应急口令改常数时间比较**——`x-admin-token`（`ADMIN_TOKEN`）比对与两个登录入口的环境变量应急口令比对统一走新增的 `utils/secureCompare.safeEqual`（定长摘要 + `timingSafeEqual`），消除 `===`/`!==` 逐字符早退的时序侧信道。**行为变更**：上线即失效全部存量管理端 JWT——旧令牌由用户端密钥签发、新校验用 `adminSecret` 验签必失败，命中 `adminAuth` 末尾的 **403「无管理员权限」**（不是 401，因为它连「合法管理端令牌」这一关都没过），**管理员需重新登录一次**（C 端不受影响，管理端 `common.js` 对 401/403 均清态跳登录）。**遗留**：①`ADMIN_JWT_SECRET` 未配置时走派生，两类令牌仍互不通用但**不构成用户端密钥泄露的隔离**（派生值可被掌握 `JWT_SECRET` 者算出），运维显式配置即可消除；②`ADMIN_TOKEN` 固定应急令牌仍不可吊销、不进实时回读。本轮新增/改写用例（`utils/secureCompare` 5 例、`config/jwt` 的 M-3 describe 5 例、`middlewares/auth` 改 1 增 2、`controllers/adminManage` 增 1）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.19
> v6.20.0 变更: 管理员令牌时效与实时权限回读（安全扫描 M-2 修复）——**接口路径、请求体、成功响应一字未改**，改的是管理端令牌的「有效期」与「校验时信什么」：①管理端访问令牌不再与用户端共用 `JWT_EXPIRES_IN`（默认 7 天），改为独立配置 `ADMIN_JWT_EXPIRES_IN`（默认 **12 小时**，支持 `s/m/h/d`）——两个登录入口的账号/角色/应急共 6 处签发全部生效，此前「后台改权限/禁用管理员最长 7 天才生效」的窗口首先被时效收窄；②令牌 payload 新增 `adminScope`（`account`/`role`/`emergency`）：`xn_admin` 与 `xn_admin_role` 两张表 id 独立自增、可能碰撞，没有它无法判断令牌里的 `id` 指向哪张表；③`adminAuth` 改为**每次请求实时回读数据库**（新增 `resolveLiveAdmin`）：管理员被删除 → **401「令牌已失效」**，被禁用 → **403「账号已被禁用」**，`permissions`/`role_id` 一律取数据库当前值——**改权限/换角色/禁用/删号在下一个请求立即生效，不再依赖重新登录或令牌过期**；④无 `adminScope` 的历史令牌一律 401 强制重新登录（与 H-4 移除无 `type` 令牌同口径）；⑤回读失败沿用吊销的 fail 取向：生产 fail-closed 503，非生产 fail-open 按令牌快照放行并告警。**两道防线分工**：H-5 吊销水位线继续覆盖「令牌本身作废」（登出、改口令）——实时回读不校验口令版本，`PUT /api/admin-manage/admins/:id/password` 的吊销仍是改密后踢掉旧令牌的**唯一**机制；删号/禁用为「吊销（第一道，生产确认不了即 503 不落库）+ 实时回读（第二道）」双保险；`role==='admin'||role_id===1` 的声明检查保留（与用户端共用密钥的收口属 M-3）。**行为变更**：升级后存量管理员令牌（无 `adminScope`）全部失效、需重新登录一次；管理端 `common.js` 对 401/403 本就清态跳登录，**前端零改动**。**遗留**：payload 内权限快照保留（仅非生产回读失败时回退用）；`admin_refresh` 仍无服务端消费入口；`ADMIN_TOKEN` 固定应急令牌不可吊销；应急 JWT 在 `ADMIN_EMERGENCY_LOGIN` 关闭后立即失效（回读命中 `emergency` 分支）。本轮改写 `tests/unit/middlewares/auth.test.js`（新增 8 例 M-2 用例）与 `admin.test.js`/`adminManage.test.js` 签发断言，因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.18
> v6.19 变更: 后台 RBAC 自提权收口（安全扫描 M-1 修复）——**所有接口的路径、请求体、成功响应一字未改**，改的是 22.19 七个写接口的**授权边界**：此前任何持 `admin:write` 的管理员都能 `PUT /api/admin-manage/admins/:id` 写入 `permissions:['all']` 或把 `role_id` 改成 1 一步成为超管（`utils/permissions.js` 见 `all` 即放行），也能重置超管（id=1）口令、改超管角色的账号与口令实现接管——没有任何「须超管」或「授予集 ⊆ 自身集」校验。现在七个写接口（`POST /admins`、`PUT /admins/:id`、`PUT /admins/:id/password`、`DELETE /admins/:id`、`POST /roles`、`PUT /roles/:id`、`DELETE /roles/:id`）在 `requirePermission('admin:write')` 之上统一执行两级边界：①**对象边界**——非超管不能操作「超管（`id=1` 或 `role_id=1` 或 `is_super` 角色）」与「有效权限超出自身范围」的管理员/角色，命中回 403，文案五条：「无权修改该管理员：目标账号权限超出你的管理范围」「无权修改该管理员密码：目标账号权限超出你的管理范围」「无权删除该管理员：目标账号权限超出你的管理范围」「无权修改该角色：超出自身权限范围」「无权删除该角色：超出自身权限范围」；②**授予边界**——非超管提交的 `permissions`/`role_id` 必须 ⊆ 其自身权限，超出回 403「无权授予超出自身权限范围的权限: <列表>」或「无权分配超出自身权限范围的角色」。超管口径不变（`isSuperAdmin`：id=1 或 role_id=1 或 `role==='super_admin'` 或权限含 `all`），超管不受限。**顺带修复**：`POST /admins` 此前只在显式传 `role_id` 时校验所选角色，「不传 `role_id`」会落到默认角色 2 而不经任何角色检查，现改为始终按有效角色（`role_id || 2`）校验，该旁路已关闭。**行为变更**：非超管管理员的越界操作由「成功」变为 403（管理端 `common.js` 透传 `message`，文案直达），同权管同权的合法操作无一受影响；22.19 接口表已据此补边界说明。**遗留**：改 `permissions`/`role_id` 仍不吊销在用令牌（权限是登录时的声明快照，沿用 H-5 口径，需被改者重新登录生效）；`ADMIN_EMERGENCY_LOGIN` 应急账号恒为 `['all']` 不受限（刻意保留）；无「平级多超管」运维入口。本轮新增 `tests/unit/utils/permissions.test.js`（11 例）与 `tests/unit/controllers/adminManage.test.js` 的 M-1 describe（12 例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.17
> v6.18 变更: .env 卫生与弱口令兜底（安全扫描 H-9 修复）——**本轮无任何接口变更**：路径、请求体、成功响应、错误码、限流阈值全部未动，改的只是「服务端从环境变量取值时的兜底行为」，登记在此供联调/部署对齐：①**行为变更**：`DB_PASSWORD` 未设置时不再静默回落 `'123456'`，本地库连接将直接失败并伴随启动自检「DB_PASSWORD 未设置或为弱值」告警——本地联调请在根 `.env` 显式配置（此前漏配会「看起来连上了」，实际用的是弱口令）；②`scripts/backup.js` docker 模式 Redis 备份不再回落 `'redis123'`，未设置 `REDIS_PASSWORD` 时该步显式失败；③`server.js` 启动自检新增 TURN 告警：`TURN_URL` 已配置而 `TURN_SECRET` 缺失/弱值（<16 字符）时提示「中继凭据可被冒签」；④`scripts/deploy-selfcheck.js` 弱密钥扫描补 `MONGO_URI` 内嵌口令特征检查；⑤四份 `.env*.example` 模板补齐全量键位（`SERVER_URL`、`ADMIN_USERNAME`/`ADMIN_PASSWORD`、`WECHAT_NOTIFY_URL`/`WECHAT_CERT_PATH`、`ALIPAY_*`×3、`STORAGE_FALLBACK`、QINIU/OSS、`CALL_CHANNEL`/`STUN_URLS`/`TURN_*`、`LLM_*`×7、`VIRTUAL_USER_CHAT_HISTORY_LIMIT`、`AUTO_MIGRATE`/`ENABLE_SWAGGER`/`SWAGGER_PROD_URL`/`STRICT_ROUTES`、`LOGS_PATH`/`LOG_TO_CONSOLE`、注释形式 `BACKUP_*`×4）并删除死键 `APP_NAME`、`SMS_SDK_APP_ID`。**遗留**：`.env` 实际口令轮换属用户侧动作（本轮零值改动、未触碰任何现存口令）；TURN 弱密钥目前仅告警不阻断启动；新增 `tests/unit/config/envHygiene.test.js`（4 例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.16
> v6.17 变更: 限流的 IP 口径与豁免开关收口（安全扫描 H-8 修复）——**所有接口的路径、请求体、成功响应、错误文案一字未改**，改的是限流生效条件：①新增 **1.7 章「限流与真实客户端 IP」**，六个限流器（全局/用户端登录/后台登录/验证码/卡密/上传）的窗口、默认阈值、环境变量与 429 文案列成一张表，并写明两条根因：`server.js` 原写死 `app.set('trust proxy', 1)` 使 `req.ip` 取自客户端可伪造的 `X-Forwarded-For`（只要 origin 可达，每次请求换一个伪造 IP 即绕过全部按 IP 计的限流，访问日志与 `xn_admin.last_login_ip` 同样可被涂抹），以及五个限流器的 `skip: nodeEnv === 'development'` 与 `NODE_ENV` 兜底值 `development` 撞在一起，忘设环境变量 = 在生产机器上整体放行；②**行为变更：`NODE_ENV=development` 不再自动豁免任何限流**，本地联调同样会撞 429，需要放开用 `SMS_RATE_LIMIT_MAX`/`LOGIN_RATE_LIMIT_MAX`/`ADMIN_LOGIN_RATE_LIMIT_MAX`/`RATE_LIMIT_MAX_REQUESTS`，或本地整体 `RATE_LIMIT_DISABLED=true`（生产设它后端拒绝启动）；③**响应头统一**：六个限流器全部 `standardHeaders:true`（7.5.1 里解析为 `draft-6`）/`legacyHeaders:false`，正常响应带 `RateLimit-Policy/Limit/Remaining/Reset`，429 带 `Retry-After`（此前只有 `apiLimiter`、`adminLoginLimiter` 两个配了标准头，其余四个回落旧的 `X-RateLimit-*`），客户端可据此展示恢复时间；④1.4 中间件表补 `apiLimiter`/`adminLoginLimiter`/`cardLimiter` 三行并标出各自阈值键；⑤1.3 状态码表 429 行补注响应头；⑥22.1 后台登录「两道防护」的第 1 道补注 v6.17 起六个限流器统一无环境豁免；⑦`TRUST_PROXY` 取值非法（`true`/`*`/`all`/`0.0.0.0/0`、跳数>10、跳数与网段混写、八位组>255、主机位非零网段）在配置加载期即抛错拒绝启动，跨机部署需显式声明反代网段，启动日志打印 `🔒 trust proxy = <取值>（来源：…）`。**遗留**：限流计数仍是进程内存（多实例各一份，需共享 store）；`LOGIN_RATE_LIMIT_MAX`/`ADMIN_LOGIN_RATE_LIMIT_MAX` 未收敛进 `config`；`tests/e2e/*` 三脚本面向开发服务器运行时需以 `RATE_LIMIT_DISABLED=true` 启动后端。本轮新增 `tests/unit/config/trustProxy.test.js`（18 例）、重写 `tests/unit/middlewares/rateLimit.test.js`（6 例，原文件自 H-3 起即与实现不符）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.15
> 更新时间: 2026-10-05
> v6.16 变更: 预约/订单状态机竞态收口（安全扫描 H-7 修复）——**接口路径、请求体、成功响应全部不变**，改的是并发语义：①`POST /api/reserve/cancel` 与 `POST /api/reserve/complete` 原来先 `findByPk` 读状态、再无条件 `update`、再 `User.increment` 打款/退款，两个并发请求会各自通过校验，导致**同一笔预约退两次款、分两次账**；现在改为事务内**条件更新占位**（`UPDATE xn_reserve SET status=4 WHERE id=? AND user_id=? AND status IN (0,1)`；完成则 `WHERE id=? AND status=1 AND (user_id=? OR target_user_id=?)`），只有影响行数=1 的那一次才继续动钱，落败方返回既有的 422「预约无法取消」/「预约状态不正确，仅可完成已确认的预约」并整体回滚。②`confirm`/`reject` 同样改条件更新（`WHERE ... AND status=0`），`reject` 的「预约单改状态 + 时间槽释放」两处写入并入同一事务（原来完全无事务），且释放只针对 `status=1` 的占用槽位，不会覆盖别人刚重新占用的时段。③`completeReserve` 的分成比例 `reserve_commission_rate`、`completeOrder` 的 `order_commission_rate` 改为**在事务内读取**（`getCommissionRate(key, fallback, transaction)` 新增可选第三参数），读比例与写金额同快照。④`POST /api/reserve/slots/toggle` 新增两条拒绝：**已成交（`status=1`）的时段不可切换**（原实现会把 1 翻回 0，凭空释放一个已占用时段→同一时段被重复预约），以及并发下状态已变（条件更新落败）返回「时间槽状态已变更，请刷新后重试」。⑤游戏订单侧：`/api/games/start`（1→2）、`/api/games/complete`（2→3，含分账与 `income_total/order_num` 累加）、`/api/games/appeal`（1|2|3→5）全部改条件更新，`/api/games/evaluate` 改为事务内 `SELECT ... FOR UPDATE` 重读订单与陪玩师资料行，重复评价不再二次计入滚动平均分。⑥**遗留**：`toggle` 接口仍忽略前端传来的 `enabled`（服务端自己翻转），前端 `reserveService.toggleSlot` 在全仓库无调用方；申诉（status=5）不做资金冲退，裁决仍靠后台人工；条件更新只保证「同一次迁移只生效一次」，跨请求的业务幂等键（如 `requestId`）尚未引入。本轮改写 2 个测试文件（`tests/unit/services/reserveService.test.js`、`gamesService.test.js`，新增 8 条并发用例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.14
> v6.15 变更: 装扮商城服务端化（安全扫描 H-6 修复）——①新增 **2.18 章「装扮商城（目录 / 购买 / 切换）」**：`GET /api/user/skins` 返回服务端目录（`utils/skinCatalog.js`，26 件四类装扮）+ 实时余额 + 每件 `owned/using` + `unlocked/needLevel`，`POST /api/user/skins/purchase` 与 `POST /api/user/skins/use` 只接受 `body.skinId`，价格、VIP 门槛、扣款金额、所有权一律由服务端判定；四类业务拒绝码 `SKIN_NOT_FOUND`/`SKIN_VIP_REQUIRED`/`INSUFFICIENT_BALANCE`/`SKIN_NOT_OWNED` 统一 422 并在 `errors.skin` 回原因码，Lv.45 等级门槛走既有 `handleLevelGate`；②**2.16 章改名为「用户偏好设置」并收口**：`POST /api/user/pref` 请求体里的 `skinShop` 被整段剥离（不参与合并、不写库），`GET` 不再回传 `skinShop`，`spend` 字段废弃（只容忍旧客户端显式传 `0`，`-100`/`'500'`/`abc` 直接 422 并指路到新接口），`POST` 响应不再带 `balance`；③门槛表删掉「`data.skinShop` 且 `spend > 0` → `skin_shop` Lv.45」这一行——它就是本缺陷根因：客户端把 `spend` 传 0 同时绕过扣费与等级门槛，把 `owned` 原样写进 pref 即白拿任意装扮；现在 `skin_shop` 门槛在购买接口无条件校验，连免费装扮的领取也要过；④购买在**同一事务**内完成门槛校验→行锁读用户→VIP 门槛→条件扣款（`UPDATE ... WHERE money >= price` 影响行数判定，不足即回滚 422）→所有权落库，重复提交不会双扣；⑤前端 `SkinShop.vue` 改为纯服务端渲染，删掉 `localStorage('skinShopData')` 与本地余额/VIP 预判，`AvatarFrame`/`IdentityBadge`/`PriorityMatching`/`StealthVisit` 四页的 `save(data, 0)` 改为 `save(data)`。**遗留**：改造前已伪造进 `xn_user_pref.data.skinShop.owned` 且**在目录内**的条目仍视为已拥有（本轮不动存量数据，核查 SQL 见《部署文档》v6.8）；装扮改价需要发版（目录是代码，无管理端 CRUD）；商城的 `using` 状态全仓库无消费方，聊页/个人页头像框读的是 `selectedAvatarFrame`/`selectedBadge`，属独立缺陷另记；本轮新增与改写的 4 个测试文件（`utils/skinCatalog` 6 例、`services/skinService` 18 例、`controllers/user` 92 例、`frontend/tests/views/skin-shop` 7 例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.13
> v6.14 变更: 服务端登出与令牌吊销（安全扫描 H-5 修复）——①新增 1.6 章「令牌吊销与登出」，写清两类吊销状态（`auth:blacklist:<sha256(令牌)>` 单令牌拉黑、`auth:revoke-user|admin:<id>` 全端下线水位线，均只存 Redis）、触发接口清单、以及 401「令牌已失效」/ 403「用途不符」/ 503「无法确认」的分工；②新增 **2.17 `POST /api/user/logout`**（需登录；此前全站没有登出接口，`authMiddleware` 里的 Redis 黑名单**只有读取侧、全仓库无任何写入点**，「退出登录」只是前端清 `localStorage`，令牌在剩余有效期内仍可继续打接口）——拉黑本次 access，可选 `body.refreshToken` 必须 `type=refresh` 且 `userId` 归属本人才一并拉黑（否则这口子会变成「替别人登出」的定向 DoS），`body.logoutAllDevices` 走水位线；因 C 端 SPA 从不保存登录时下发的 refresh 令牌，**用户端登出等于该账号全端下线，不是单设备语义**；③新增 **`POST /api/admin/logout`**（22.1）与 **`POST /api/admin-manage/logout`**（22.19），同一实现，吊销的是「本次请求实际命中的那一枚令牌」（`adminAuth` 支持 `Authorization` 与 `x-admin-token` 两个头，故中间件把原文留在 `req.adminToken`/`req.adminTokenKind` 上），`ADMIN_TOKEN` 应急固定令牌走 `revocable:false` 分支；④**2.10 重置密码**改为「写库前先全端下线」，响应新增 `data.devicesRevoked`；⑤**2.13 刷新 Token** 增加吊销闸门：已被登出或本人已全端下线 → 401「登录状态已失效，请重新登录」，生产无法确认 → 503；⑥22.1 补「登出」与「会话终止」两段：`PUT /api/admin-manage/admins/:id/password`、`DELETE /api/admin-manage/admins/:id`、`PUT /api/admin-manage/admins/:id`（仅 `status≠1`）都在改库前先作废该账号会话并回 `data.sessionsRevoked`（`adminAuth` 不回查数据库，吊销是唯一收口），22.2 的 `PUT /api/admin/users/:id/status` 封号时尽力而为地全端下线；⑦写入侧与读取侧统一 fail 取向：生产 `fail-closed`（确认不了就不改密/不删号，503），非生产 `fail-open` 完成业务并如实回报（本地与 CI 常无 Redis，写入侧硬失败会把「重置密码」「改管理员口令」变成不可用功能）；⑧`optionalAuth` 的失败取向明确为「按匿名处理」而非 503。**遗留**：`ADMIN_TOKEN` 不可吊销；修改管理员**权限/角色**仍不吊销在用令牌（快照口径，需重新登录才生效，本轮故意避免管理员自踢）；`admin_refresh` 依旧无服务端消费入口；Redis 实例重建/清空即黑名单与水位线全丢（已登出令牌复活），需持久化与备份。本轮后端新增/改写用例与前端 2 个 store 用例因本机无 node/npm **未执行**，仅静态复核。
> v6.13 变更: 令牌用途绑定（安全扫描 H-4 修复）——①`config/jwt.js` 新增 `TOKEN_TYPES`（`access`/`refresh`/`admin`/`admin_refresh`），所有签发一律把 `type` 写进 payload，`generateToken`/`signToken` 传入未知或缺省 type 直接抛错（不给「忘记带 type」留活口）；②`verifyToken(token, allowedTypes)` 增加用途白名单，四个鉴权入口全部显式传名单：`authMiddleware`/`optionalAuth`/Socket.IO 握手只认 `access`，`adminAuth` 只认 `admin`，`refreshAccessToken` 只认 `refresh`——此前 access、refresh、管理员令牌同密钥同结构，一枚 30 天的 refresh token 可直接当 Bearer 访问全部业务接口，管理员令牌也能跨用途当用户令牌用；③白名单不匹配统一返回 `null`，走各入口既有的 401（用户端）/403（管理端）/`UNAUTHORIZED`（socket）分支，不再出现「查得到用户却用途不对」的中间态；④刷新重签只结转 `userId`，refresh payload 里的其他声明不再进入新令牌（旧代码里 `...payload` 是从未使用的死代码，一旦后续改动直接拿去签名就能把伪造的 `role`/`permissions` 洗进 access 令牌）；⑤**行为变更：没有 `type` 的历史令牌一律判为无效，上线后所有既有会话需要重新登录**（与 C-1 的验证码口径同属预期破坏，客户端 401 分支已自动清本地登录态并跳转登录页）；⑥`/api/user/refresh-token` 明确只接受 `type=refresh`，管理端 `/api/admin*` 只接受 `type=admin` 或 `ADMIN_TOKEN` 固定应急令牌。遗留：管理员 refresh token（`type=admin_refresh`）目前**没有任何服务端消费入口**，前端只把它写进 `localStorage`，轮换与吊销待 H-5 一并处理；`JWT_EXPIRES_IN` 默认仍是 `7d`，access 令牌时效过长属运维项。
> v6.12 变更: 后台登录爆破防护（安全扫描 H-3 修复）——①22.1 `POST /api/admin/login` 与 22.19 `POST /api/admin-manage/login` 挂上 `adminLoginLimiter`（单 IP 15 分钟 5 次，`ADMIN_LOGIN_RATE_LIMIT_MAX` 可调，开发环境不再豁免）；②新增账号维度失败锁定 `adminLoginGuard`——Redis 计数键 `admin:login:fail:<归一化账号>`，15 分钟内失败 5 次（`ADMIN_LOGIN_MAX_FAILS`）即锁定，锁定期间返回 429 + `data.retryAfterSec`，成功登录或应急登录成功即清零；③不存在的账号同样计数，避免锁定行为变成「账号是否存在」探测；缺参数的 400 不计数，防止任何人用空请求把管理员账号锁死；④Redis 不可用或读写超时时**保守拒绝**并返回 503（安全控制不做 fail-open）；⑤22.1 响应载荷校正为真实的 `data.user`（旧文档写的 `{ token, adminId, username }` 代码从不返回），并写明三级口令口径（数据库账号 → 角色账号 → `ADMIN_EMERGENCY_LOGIN` 应急口令）与 400/401/403/429/503/500 分流；⑥管理端 `admin-frontend/src/common/common.js` 改为优先透出响应体 `message`，此前 429/503 一律显示成「请求失败 (429)」，锁定提示与恢复时间到不了用户眼前。遗留：应急口令比对仍是普通 `!==`（非常量时间）；登录成功暂无审计记录。
> v6.11 变更: 支付回调收口（安全扫描 H-2 修复）——①5.8 `POST /api/pay/wx-callback` **改为需要登录**，服务层再校验「订单属于当前用户」，非本人 403、订单不存在 404；②`/api/pay/wx-callback` 入账改为原子幂等（`UPDATE xn_order_chong SET status=1,pay_time,update_time WHERE id=? AND status=0` + 影响行数判定），替换原「`findOne(status:0)` → `update` → `increment`」的双加竞态（微信对同一订单会并发重发通知）；微信并发重发通知时只有一笔能加币（原 `findOne(status:0) → update → increment` 两笔都能读到未支付状态，同一单重复到账）；③新增服务端金额核对——平台回传的实付分值必须等于下单应付分值（`round(amount×100)`），不一致 422 拒绝入账，5.4 通知链路同时补上 `result_code`/`appid`/`mch_id`/`fee_type` 四项校验（原实现只看 `return_code` 和签名，未付款通知也能入账）；④5.4 已入账订单的重复通知改回 `SUCCESS`（原回 FAIL，微信会按退避策略无限重发），5.5/5.6 `wx-query`/`wx-close` 增加订单归属校验；⑤新增 5.9 小节记录错误码分流（403/404/422/200 幂等/500）与 64KB 回调请求体上限；⑥顺带修正两处会让支付永久不可用的文档/配置错误：`parseXml` 解析不了微信真实报文的 `<![CDATA[...]]>` 包裹（真实回调一律被判失败）、`部署文档.md` 的支付环境变量键名与代码不符且把商户回调地址写成 `/wx-callback`。遗留：平台流水号 `transaction_id` 无列可落库（`xn_order_chong` 无支付流水列），支付宝无服务端下单/回调实现。
> v6.10 变更: 通话房间收口（安全扫描 C-4 修复）——①11.1 `GET /api/trtc/auth` **不再无条件发放 UserSig**：不传 `roomId` 只回答「TRTC 通道是否开通」（`configured`/`appId`，`userSig` 恒为 `null` + `requiresRoomId:true`），传 `roomId` 才在服务端核对 `xn_call_record` 成员关系后签票；②11.2/11.3 房间与计费接口全部加成员闸门（`enter`/`leave`/`room/:roomId`/`billing/start`），非成员 403、房间不存在 404、通话已结束或房间号非法 422、意外故障仍 500；③`room/:roomId` 响应改为真实通话状态（原先写死 `status:'active'` 且不需要任何身份）；④11.1 `start` 的 `trtc_room_id` 改为 `crypto.randomInt` + 活跃通话查重（原 `Math.random` 不查重，并发约 1200 通即有近半概率串房）。遗留：进房票据仍是房间无关的普通 UserSig（`generateRoomSig` 是字符串房间号布局，前端进的是数字房间，离线无法校验，改动会打断真实通话）；socket 的 `call_*`/`webrtc_*` 转发仍信任客户端上报的 `toId`。
> v6.9 变更: 卡密兑现收口（安全扫描 C-3 修复）——①5.8 `/validate-card` 由「不需要认证」改为**需要认证**，`/use-card`、`/redeem-key` 一并挂 `cardLimiter`；②`/validate-card`、`/use-card` 强制校验 `card_password`（请求体新增 `cardPwd`），卡号不存在与密码错误合并为同一条 422「卡号或密码错误」，免登录枚举卡号的 oracle 消失；③补记核销与生成口径：卡号/密码/25 位密钥改用 `crypto.randomInt` 逐字符生成（原 `Math.random`，且卡号以 `Date.now()` 开头可预测），密码用 sha256 摘要后 `timingSafeEqual` 比对；④22.17 创建卡密同步说明。遗留：`card_password` 仍明文落库（管理端需展示给发卡方），历史卡密建议作废重发。
> v6.8 变更: ①24 章钱包提现改口径——`POST /api/wallet/withdraw` 现在在事务内**条件扣减真实余额 `xn_user.money`**（此前只写提现单、从不扣款），`GET /api/wallet/overview` 的 `totalAssets` 由「累计收入−已申请提现」的派生值改为真实余额，并新增 `balance`/`giftMoney`；②4.4 礼物提现同步扣减 `money`（原来只扣 `gift_money`，同一笔收益既能消费又能提现）；③22.4 审核接口 `approve`/`reject` 改为条件更新（`WHERE is_check=0`）保证状态机幂等，驳回按渠道原路退回（wallet→`money`，gift→`money`+`gift_money`，admin→`money`）。
> v6.7 变更: ①2.7 `login-mobile` 与 2.9 `register` 补记服务端强制短信验证码校验（安全扫描 C-1/H-1 修复——此前 `code` 从不校验，凭任意手机号即可登录/注册任意账号）；②2.6 `send-sms` 补 `type` 三场景（login/register/reset）与独立 Redis 键、60 秒冷却、5 次失败作废、生产不回传明文码；③2.10 `reset-password` 明确 `reset` 场景与 503 语义；④顺带校正 2.7 响应载荷——实际返回 `accessToken/refreshToken/expiresIn/refreshExpiresIn`，旧文档写的 `token` 字段不存在
> v6.6 变更: ①16.7 开屏弹窗补全过滤规则、`frequency` 档位语义与响应载荷，并记录 C 端接线（`App.vue` + `SplashPopup.vue` + `utils/splashScreen.js`，去重在客户端 `localStorage`）
> v6.5 变更: ①新增 2.14 `GET /api/user/level`、2.15 `POST /api/user/level/check-in`、2.16 `GET/POST /api/user/pref`（含等级门槛表）；②7.6 创建帖子补带图门槛（Lv.15）与 +20 经验说明，6.3 完成订单补 +50 经验说明，13 相册补 Lv.25 容量额度（20→50 张），2.2 补非空签名 Lv.5 门槛；③18.1 用户表补 `exp / last_check_in_time / level_backfill_time` 三列与历史回填说明
> v6.4 变更: ①修正 2.1 用户信息响应——删除代码未返回的 7 个字段（vipExpireTime/totalGiftBalance/isDaRen/isManager/userStatus/createTime/lastLoginTime），保留实际返回的 14 个字段与 authService.getUserInfo 一致；②修正 3.6 房间创建请求体（{ targetUserId, type } → { title, subtitle, background, roomType }）与 chat.js 路由一致
> v6.3 变更: ①修正 3.1 聊天列表响应字段（roomId→id, targetUserId→fromId/toId, lastMessage→content, lastMessageTime→sendTime，删除分页参数）与 chatService.getChatList 一致；②修正 3.2 聊天消息响应字段（messageId→id, fromUserId→fromId, toUserId→toId, status→isSelf/isRevoked, createTime→sendTime）与 chatService.getChatMessages 一致；③2.1 用户信息响应补全 isFollow 字段；④2.13 refresh-token 认证要求从"需要"改为"无需认证"
> v6.2 变更: ①修正 2.1 用户信息响应字段（gender:"female"→sex:2, region→city, 删除不存在的 followCount, 补全 giftBalance/isDaRen/isManager/userStatus/description）；②修正 2.2 更新用户信息请求体（signature→description）；③修正 2.3 关注请求体（userId→targetUserId, 补全 action 参数）；④补全 18.1 用户字段映射表（新增 gift_money/gift_money_zong/fans_num/is_dav/is_manage_normal/status/jinyan_time/dec 映射）；⑤修正 sex 字段映射说明（直接传数字 0/1/2，不做 gender 字符串转换）

## 1. 接口规范

### 1.1 通用说明

- **基础地址**: `/api`
- **数据格式**: JSON
- **认证方式**: JWT Token (放在 `Authorization: Bearer <token>` 请求头)，令牌自带用途声明 `type`，见 1.5
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
| 429 | 请求频率限制（响应带 `Retry-After` 与 `RateLimit-*` 头；后台账号锁定另带 `data.retryAfterSec`） |
| 500 | 服务器内部错误 |

### 1.4 中间件

| 中间件 | 说明 |
|--------|------|
| `authMiddleware` | 需要登录认证，只接受 `type=access` 的令牌 |
| `optionalAuth` | 可选登录认证，同样只认 `type=access`；用途不符时按「未登录」处理（不写入 `req.userId`） |
| `adminAuth` | 管理员权限，只接受 `type=admin` 的令牌或 `ADMIN_TOKEN` 固定应急令牌 |
| `apiLimiter` | 全局频率限制，覆盖 `/api` 下所有业务路由（健康检查在其之前注册，不受限）；`RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` |
| `loginLimiter` | 登录频率限制，15 分钟 20 次（`LOGIN_RATE_LIMIT_MAX`） |
| `adminLoginLimiter` | 后台登录频率限制，15 分钟 5 次（`ADMIN_LOGIN_RATE_LIMIT_MAX`），见 22.1 |
| `smsLimiter` | 短信频率限制，60 秒 1 次（`SMS_RATE_LIMIT_MAX`） |
| `cardLimiter` | 卡密校验频率限制，60 秒 10 次，见 5.x |
| `uploadLimiter` | 上传频率限制，60 秒 20 次 |

> 六个限流器**不再按 `NODE_ENV` 豁免**（安全扫描 H-8，见 1.7）。响应头统一为 IETF draft-6 口径：正常响应带 `RateLimit-Policy`/`RateLimit-Limit`/`RateLimit-Remaining`/`RateLimit-Reset`，429 另带 `Retry-After`；旧的 `X-RateLimit-*` 已关闭（`legacyHeaders:false`）。

### 1.5 令牌用途（`type` 声明）

安全扫描 H-4：四类令牌由同一密钥 `JWT_SECRET` 签名，用途只由 payload 里的 `type` 区分，校验侧按白名单接受。

| `type` | 签发方 | 时效 | 可访问 | 备注 |
|--------|--------|------|--------|------|
| `access` | `generateTokenPair()`（登录/注册/第三方登录/刷新） | `JWT_EXPIRES_IN`（默认 `7d`） | 全部 `authMiddleware` 业务接口、Socket.IO 握手 | payload 只有 `userId` |
| `refresh` | `generateTokenPair()`、`refreshAccessToken()` | `JWT_REFRESH_EXPIRES_IN`（默认 `30d`） | 仅 `POST /api/user/refresh-token` | 不能当 Bearer 使用 |
| `admin` | `controllers/admin.js`、`controllers/adminManage.js` 的 `signToken(..., TOKEN_TYPES.ADMIN)` | `ADMIN_JWT_EXPIRES_IN`（默认 `12h`，v6.20.0 M-2 起独立于用户端） | 全部 `adminAuth` 路由（每次请求实时回读主体） | payload 含 `role: 'admin'`/`role_id`/`adminScope`/`permissions`（权限仅作非生产回退快照） |
| `admin_refresh` | 同上的 refreshToken 分支 | `JWT_REFRESH_EXPIRES_IN`（默认 `30d`） | 暂无消费入口（遗留） | 管理端只把它存进 `localStorage` |

- **校验入口**：`authMiddleware`/`optionalAuth` → `[access]`；`adminAuth` → `[admin]`；`socket/index.js` 握手 → `[access]`；`refreshAccessToken` → `[refresh]`。
- **不匹配的处理**：`verifyToken()` 返回 `null`，走各入口既有的 401（用户端）/403（管理端）/`UNAUTHORIZED`（Socket）分支，不做「先验签通过再降级」的兼容。

### 1.6 令牌吊销与登出（安全扫描 H-5）

用途绑定解决的是「哪类令牌能进哪个门」，本节解决「已经发出去的令牌怎么作废」。读写都收在 `backend/src/services/tokenRevocation.js`，状态**只存 Redis**。

| 手段 | Redis 键 | 作用范围 | TTL |
|------|----------|----------|-----|
| 单令牌拉黑 | `auth:blacklist:<sha256(令牌原文)>` | 登出当前设备（含随请求提交的本人 refresh） | 令牌剩余寿命，上限 `JWT_REFRESH_EXPIRES_IN` |
| 主体水位线 | `auth:revoke-user:<userId>` / `auth:revoke-admin:<adminId>` | 全端下线：`iat` 早于水位线的令牌一律作废 | `JWT_REFRESH_EXPIRES_IN`（刷新链路必须一并拦住） |

- **键里放摘要不放原文**：原始 JWT 是可直接复用的凭据，放进键名就会出现在 `MONITOR` 输出、`KEYS` 结果与 RDB 备份里。
- **触发吊销的接口**：`POST /api/user/logout`、`POST /api/admin/logout`、`POST /api/admin-manage/logout`、`POST /api/user/reset-password`（全端下线）、`PUT /api/admin-manage/admins/:id/password`、`DELETE /api/admin-manage/admins/:id`、`PUT /api/admin-manage/admins/:id`（仅 `status≠1`）、`PUT /api/admin/users/:id/status`（封号，尽力而为）。
- **读取侧覆盖**：`authMiddleware`、`optionalAuth`、`adminAuth`、`POST /api/user/refresh-token`、Socket.IO 握手。
- **响应码语义**：已吊销 → **401**「令牌已失效」（客户端据此清登录态并跳登录页）；用途不符/格式非法 → 403「无管理员权限」或 401「令牌无效或已过期」；**管理端实时回读（v6.20.0，M-2）**命中「管理员已删除 / 旧格式令牌（无 `adminScope`）」→ 401「令牌已失效」，「管理员被禁用」→ 403「账号已被禁用」，数据库回读失败且生产 fail-closed → 503；吊销状态**无法确认**（Redis 未连接、命令报错或超 2 秒）→ 生产 **503**「认证服务暂时不可用，请稍后重试」，非生产 fail-open 放行。`optionalAuth` 例外：无法确认时按**匿名**处理而不是 503，它守的是公开页面，拒绝整站可读性换不到安全收益。
- **fail 取向开关**：`AUTH_BLACKLIST_FAIL_MODE`（`closed` / `open`）可覆盖默认值，默认按 `NODE_ENV=production` 取 `closed`。⚠️ 生产环境这意味着 **Redis 不可达 = 所有需登录接口 503**，详见《部署文档》v6.7。
- **写入侧同一取向**：登出与「改密/禁用/删号」在无法确认吊销时，生产返回 503 且**不改库**（不留下「密码已换、旧令牌照常能用」的中间态），非生产完成业务并用 `devicesRevoked`/`sessionsRevoked`/`serverRevoked` 如实回报。
- **不可吊销的例外**：`ADMIN_TOKEN` 环境变量应急令牌是固定字符串，无 `exp` 无签名，吊销名单管不到它；用它登录时登出接口返回 `revocable: false`，只能清前端本地态。
- **签发约束**：`generateToken(payload, type)` 与 `signToken(payload, expiresIn, type)` 对未知/缺省 type 抛错，杜绝漏带 `type` 的新令牌。
- **历史令牌**：升级前签发的令牌没有 `type`，一律判为无效 → 全端重新登录（见 部署文档.md v6.6）。

### 1.7 限流与真实客户端 IP（安全扫描 H-8）

所有 `*Limiter` 都按 **IP** 计数，因此「这个 IP 是谁」本身就是安全边界。本节写接口侧的可见契约，实现细节见《后端开发文档》v6.15 的 2.1/2.2 章。

| 限流位置 | 窗口 | 默认阈值 | 环境变量 | 超限响应 |
|--------|--------|--------|----------|----------|
| `/api` 全局 | `RATE_LIMIT_WINDOW_MS`（默认 60s） | 100 | `RATE_LIMIT_MAX_REQUESTS` | 429 `请求过于频繁，请稍后再试` |
| 用户端登录 | 15 分钟 | 20 | `LOGIN_RATE_LIMIT_MAX` | 429 `登录尝试次数过多，请15分钟后再试` |
| 后台登录 | 15 分钟 | 5 | `ADMIN_LOGIN_RATE_LIMIT_MAX` | 429 `后台登录尝试次数过多，请15分钟后再试` |
| 验证码发送 | 60 秒 | 1 | `SMS_RATE_LIMIT_MAX` | 429 `验证码发送过于频繁，请60秒后再试` |
| 卡密校验 | 60 秒 | 10 | 无（写死） | 429 `卡密校验过于频繁，请稍后再试` |
| 上传 | 60 秒 | 20 | 无（写死） | 429 `上传过于频繁，请稍后再试` |

- **一律不豁免开发环境**：`NODE_ENV=development` 过去会让上表除后台登录外的五条整体放行（判据是 `nodeEnv === 'development'`，而 `NODE_ENV` 缺省值恰是它）。现在只有 `RATE_LIMIT_DISABLED=true` 一个开关，且 `NODE_ENV=production` 时设它后端**拒绝启动**。
- **响应头**：六个限流器统一 `standardHeaders: true`（在 express-rate-limit 7.5.1 解析为 `draft-6`）/ `legacyHeaders: false` → 429 与正常响应都带 `RateLimit-Policy`、`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`，429 另带 `Retry-After`（此前只有 `apiLimiter` 与 `adminLoginLimiter` 配了标准头，其余四个用的是废弃的 `X-RateLimit-*`）。客户端可据此提示「N 秒后重试」，后台登录锁定还额外给 `data.retryAfterSec`。
- **IP 的可信度由 `TRUST_PROXY` 决定**（`src/config/trustProxy.js`，默认 `loopback`）：写死「信任一跳」时任何直连客户端都能用 `X-Forwarded-For` 每次换一个 `req.ip`，上表阈值等于不存在；默认只信任同机反向代理，配 nginx 的 `$proxy_add_x_forwarded_for` 正好取到真实客户端 IP。
- **取值非法即拒绝启动**：`true`/`*`/`all`、`0.0.0.0/0`、跳数 >10、跳数与网段混写、八位组 >255、主机位非零的网段（如 `123.45.67.89/24`，proxy-addr 会静默掩成整段）都会让 `src/config` 在加载时抛错，不留下「配置写错但限流悄悄失效」的状态。跨机部署（docker-compose、K8s ingress）必须显式声明反代网段，启动日志会打印 `🔒 trust proxy = <取值>（来源：…）`。
- **仍存在的边界**：①计数在进程内存，多实例部署时每实例各一份（需共享 store 才能全站一致，遗留）；②IP 维度只挡粗放爆破，换代理即可绕过，账号维度锁定（`adminLoginGuard`、验证码服务端计数）是必须叠加的第二层，见 22.1 与 2.2。

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
    "description": "个性签名",
    "mobile": "138****8888"
  }
}
```

> `mobile` 仅在 `userId` 为空或等于本人时返回脱敏值；查询他人资料不返回手机号（v6.49.0）。

> `profileExtra`（v6.50.0）：资料扩展字段对象，公开字段 `birthday/height/profession/hobbies/games/bgImage/tags` 所有查看者可见；`wechat/email` 仅本人可见。存量无该数据时字段缺省。

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
  "description": "个性签名",
  "profileExtra": { "birthday": "1998-01-01", "height": 170, "profession": "设计师", "hobbies": ["游戏"], "games": ["王者荣耀"], "price": 88, "wechat": "wx_id", "email": "a@b.com", "bgImage": "url", "tags": [1,2] }
}
```
- **响应**: `{ "code": 200, "message": "更新成功" }`
- **profileExtra（v6.50.0）**: 可选对象，存放在 `xn_user_pref.data.profileExtra`（无表结构变更）；只提交 `profileExtra` 时不会触发 User 空更新。数组/数字/空值服务端做边界归一。
- **等级门槛（v6.5）**: 请求体含非空 `dec`（个性签名，前端字段名为 `description`）时校验 `signature` 权益，Lv.5 以下返回 `422`（`errors.level`，见 2.16）；不填签名、清空签名或只改昵称/头像等均不受限。更新成功不产生经验。

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
- **请求体**: `{ "mobile": "13800138000", "type": "login" }`（`phone` 为 `mobile` 别名）
- **`type`**: `login` | `register` | `reset`，缺省或非法值一律按 `login` 处理
- **说明（v6.7.0）**: 三类场景各用独立 Redis 键 `sms:code:<type>:<mobile>`，登录码不能用于注册或重置密码；同一手机号同一场景 60 秒冷却；有效期 300 秒
- **响应**: 生产环境只回 `data: {}`；**显式声明的非生产环境**（`NODE_ENV=development`/`test`/`staging`，v6.22.0 起要求 `NODE_ENV` 已显式设置）额外回传 `data.code`（6 位明文，仅供联调，前端自动填入验证码输入框）
- **失败**: 短信通道未配置时 422（生产缺 `SMS_APP_ID`、或 `NODE_ENV` 未显式声明时非生产分支不回传验证码）；提示缺少 `SMS_TEMPLATE_ID` 时同样 422

### 2.7 手机号登录

- **接口**: `POST /api/user/login-mobile`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "mobile": "13800138000", "code": "123456" }`
- **说明（v6.7.0，修复 C-1）**: 服务端在查库之前强制执行 `smsService.verifyCode(mobile, code, 'login')`。此前 `code` 形参从未被校验，凭任意手机号即可登录任意账号（含自动注册），属完整账户接管。验证码连续 5 次错误即作废，须重新获取
- **响应**:
```json
{
  "code": 200,
  "data": {
    "userId": 1,
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "7d",
    "refreshExpiresIn": "30d",
    "nickname": "小雪"
  }
}
```
- **失败**: 验证码错误/过期 → 422，`message` 为「验证码错误」「验证码已过期」「验证码错误次数过多，请重新获取」之一

### 2.8 账号密码登录

- **接口**: `POST /api/user/login`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "username": "xxx", "password": "xxx" }`

### 2.9 注册

- **接口**: `POST /api/user/register`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "phone": "13800138000", "password": "xxx", "code": "123456" }`
- **说明（v6.7.0，修复 H-1）**: 服务端强制执行 `verifyCode(phone, code, 'register')`。此前只校验 `code` 字段非空、从不验证内容，无需真实手机号即可批量占位注册。密码长度 6–16，手机号需匹配 `^1[3-9]\d{9}$`

### 2.10 重置密码

- **接口**: `POST /api/user/reset-password`
- **认证**: 不需要
- **限流**: `loginLimiter`
- **请求体**: `{ "phone": "13800138000", "password": "xxx", "code": "123456" }`
- **说明（v6.7.0）**: 校验场景显式声明为 `reset`（此前与登录/注册共用同一个 Redis 键，登录码可直接改他人密码）；短信服务不可用时返回 503 而非放行
- **会话吊销（v6.14.0，修复 H-5）**: 校验通过并写库**之前**，先把该用户此刻之前的全部令牌（access + refresh）作废（Redis 水位线 `auth:revoke-user:<userId>`），因此重置密码等同「所有设备退出登录」。响应 `data.devicesRevoked` 表示吊销是否确实写入：生产环境拿不到吊销状态时直接 503 且**不改密码**（不留下「密码已换、旧令牌照常能用」的中间态），非生产 fail-open 完成重置并回 `devicesRevoked: false`
- **响应**: `{ "code": 200, "message": "密码重置成功，所有设备需重新登录", "data": { "devicesRevoked": true } }`

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
- **用途限制**（H-4）: `refreshToken` 必须是 `type=refresh` 的令牌；把 access 令牌（`type=access`）塞进来同样报 422「无效的refresh token」。新签发的两枚分别携带 `access`/`refresh`，且 payload 只保留 `userId`。
- **吊销闸门**（v6.14.0，修复 H-5）: 重签之前会查吊销状态——该枚 refresh 已被登出、或本人已执行过「全端下线」（水位线晚于其 `iat`），返回 **401**「登录状态已失效，请重新登录」；生产环境 Redis 不可达导致无法确认时返回 **503**（不做「当作没登出」的降级），非生产 fail-open 照常续签。

### 2.17 登出（服务端吊销令牌）

- **接口**: `POST /api/user/logout`
- **认证**: 需要（`authMiddleware`）
- **请求体**: `{ "refreshToken": "可选", "logoutAllDevices": true }`（均可省略）
- **说明（v6.14.0，修复 H-5）**: 此前全站没有登出接口，`authMiddleware` 里的 Redis 黑名单**只有读取侧、没有任何写入点**——「退出登录」只是前端清 `localStorage`，令牌在剩余有效期（access 默认 `7d`、refresh `30d`）内依然可以直接打接口，被盗令牌不会因为用户登出而失效。现在登出会真正写吊销状态：
  - 本次请求使用的 access 令牌 → 拉黑 `auth:blacklist:<sha256(令牌)>`（键里放摘要不放原文，避免原始 JWT 出现在 `MONITOR`/`KEYS`/RDB 备份里；TTL 取令牌剩余寿命，到期自动清理）；
  - `body.refreshToken` → **只有**验签通过、`type=refresh` 且 `userId` 与当前登录者一致才拉黑（否则这个口子会变成「替别人登出」的定向 DoS）；
  - `body.logoutAllDevices` → 改走水位线 `auth:revoke-user:<userId>`，把该账号此刻之前签发的全部令牌一次作废。C 端虽然保存 `refreshToken` 并在 401 时静默续期（B-6），登出仍走水位线——只拉黑 access 会留下一枚 30 天内仍可换新令牌的孤儿凭据，所以**用户端登出即全端下线，不是单设备语义**。
- **响应**: `{ "code": 200, "message": "已登出", "data": { "clientShouldClearToken": true, "serverRevoked": true } }`
- **错误码**: 401 令牌无效/已失效；503 生产环境下吊销状态无法确认（Redis 不可用或写不进），此时**不假装已登出**；非生产 fail-open 返回 200 且 `serverRevoked: false`
- **前端配合**: `frontend/src/store/user-info.js` 的 `logout()` **先发起本接口再清本地态**（`request()` 在同步阶段就读 `localStorage` 拼 `Authorization`，顺序反了会发成一个未认证请求），5 秒超时 + 静默中止，服务端失败不阻塞退出

### 2.19 修改密码（已登录）

- **接口**: `POST /api/user/change-password`
- **认证**: 需要（`authMiddleware`）
- **请求体**: `{ "oldPassword": "旧密码", "newPassword": "新密码" }`（新密码 6~32 位，且不能与旧密码相同）
- **会话吊销（v6.43.0，补 H-5 口子）**: 旧密码校验通过后、写库**之前**，先吊销该账号全部令牌（水位线 `auth:revoke-user:<userId>`），与 2.10 重置密码同口径；生产环境吊销状态无法确认时返回 **503 且不改库**，避免「密码已改、旧令牌仍有效」的中间态
- **响应**: `{ "code": 200, "message": "密码修改成功，请重新登录", "data": { "devicesRevoked": true } }`
- **错误**: 缺参 / 旧密码错误 → **400**；新密码长度不合法或与旧密码相同 → **422**；吊销不可确认（生产 fail-closed）→ **503**

### 2.20 换绑手机号（v6.50.0）

- **发送双验证码**: `POST /api/user/change-mobile/send-code`（`authMiddleware` + `smsLimiter`）
  - 请求体 `{ "newPhone": "13900000000" }`（旧号取当前登录账号已绑定手机号）
  - 一次请求分别按 `bind_old` / `bind_new` 场景给旧号、新号发码，避免两次请求撞 IP 1 次/分钟限流；非生产/测试白名单回传 `{ devCodes: { oldCode, newCode } }`
  - 错误：未绑定手机号 `MOBILE_NOT_BOUND`；新号格式/与旧号相同/已被占用 → 422；短信未配置 → 503
- **确认换号**: `POST /api/user/change-mobile`（`authMiddleware`）
  - 请求体 `{ "oldCode": "123456", "newCode": "654321" }`
  - 服务端双码校验 → `mobile_hash` 唯一查重 → 先吊销该账号全部 access+refresh（水位线）→ 事务内写 `mobile` 密文与 `mobile_hash`
  - 响应 `{ "code": 200, "message": "手机号更换成功，请重新登录", "data": { "requireRelogin": true } }`
  - 失败时不改任何数据；吊销不可确认（生产 Redis 不可用）→ 503

### 2.14 获取等级经验信息

- **接口**: `GET /api/user/level`
- **认证**: 需要
- **说明**: 等级加速页（`LevelAcceleration.vue`）的唯一数据源。升级曲线为 `lv * 1000 + 500`，`exp` 存**当前等级内的进度**（非累计经验），升级时溢出经验自动结转下一级（`utils/level.js` 为唯一口径，接口与门槛校验共用同一份常量）。
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "lv": 3,
    "exp": 260,
    "nextLevelExp": 3500,
    "remainExp": 3240,
    "percent": 7,
    "vip": true,
    "vipLevel": 2,
    "boost": 1.5,
    "checkedInToday": false,
    "expSources": {
      "order_completed": 50,
      "post_created": 20,
      "daily_check_in": 10,
      "real_name_verified": 100
    },
    "boostTable": { "0": 1, "1": 1.2, "2": 1.5, "3": 1.8, "4": 2 },
    "benefits": [
      { "key": "signature", "name": "解锁个性签名", "level": 5, "unlocked": false },
      { "key": "skin_shop", "name": "解锁装扮商城", "level": 45, "unlocked": false }
    ]
  }
}
```
> `benefits` 只下发 7 项，每一项都对应产品里真实存在的入口（门槛总表见《数据库设计文档》4.1.2，唯一口径 `backend/src/utils/level.js`），达标即可用、不达标服务端直接 422。

### 2.15 每日签到

- **接口**: `POST /api/user/level/check-in`
- **认证**: 需要
- **请求体**: 无
- **说明**: 按**自然日**去重。实现上用条件更新做原子占位（`UPDATE ... SET last_check_in_time = now WHERE id = ? AND last_check_in_time < 今日0点`），只有影响行数为 1 的请求才继续加经验，因此并发重复请求不会各发一份。签到获得的经验同样先乘 VIP 倍率再入账。
- **响应（成功）**: `{ "code": 200, "message": "签到成功", "data": { "lv": 3, "exp": 275, "added": 10, "leveledUp": false, "boost": 1.5, "alreadyCheckedIn": false } }`
- **响应（当日已签到）**: `422` `{ "code": 422, "message": "今日已签到" }`

### 2.16 用户偏好设置

- **接口**: `GET /api/user/pref`、`POST /api/user/pref`
- **认证**: 需要
- **说明**: 读写 `xn_user_pref`（每用户一行，`data` 为 JSON 文本，**按顶层键合并**写入，只覆盖本次提交的键），隐身访问 / 优先匹配 / 身份标识 / 头像框四个页面共用。
  **v6.15（安全扫描 H-6）起本接口不再承载装扮商城**：请求体里的 `skinShop` 会被服务端剥离（装扮所有权只由 2.18 的接口写入），`GET` 返回体也不再包含 `skinShop`；
  `spend` 字段废弃——只容忍旧客户端显式传 `0`，任何其它取值（`10`、`-100`、`'500'`、`abc`）一律 `422` 并指路到 `POST /api/user/skins/purchase`。
- **请求体**: `{ "data": { "stealthSettings": { "stealth": true } } }`
- **响应（成功）**: `GET` → `{ "code": 200, "data": { "data": { "stealthSettings": { "stealth": true } } } }`（无记录时 `data` 为 `{}`）；`POST` → `{ "code": 200, "message": "已保存", "data": {} }`（**不再回传 `balance`**，余额见 `GET /api/user/skins` 或购买响应）
- **响应（spend 非法）**: `422` `{ "code": 422, "message": "扣款金额不再由客户端决定，请改调 POST /api/user/skins/purchase", "errors": { "spend": ["扣款金额不再由客户端决定，请改调 POST /api/user/skins/purchase"] } }`
- **等级门槛（v6.5，v6.15 收敛）**: `POST` 只在请求**真正开启**某项权益时校验等级，关闭开关与纯保存偏好均不受限：

| 触发条件 | 权益 | 所需等级 |
|---|---|---|
| `data.stealthSettings.stealth === true` | `stealth_visit` | Lv.10 |
| `data.priorityMatchingSettings` 存在 | `priority_matching` | Lv.30 |
| `data.selectedBadge` 非空 | `identity_badge` | Lv.20 |

> 原第四行「`data.skinShop` 存在且 `spend > 0` → `skin_shop` Lv.45」已删除：客户端把 `spend` 传 `0` 就能同时跳过扣费与门槛，
> 装扮商城的门槛判定改由 2.18 的购买接口**无条件**执行。

- **响应（等级不足）**: `422`
```json
{
  "code": 422,
  "message": "等级不足：解锁优先匹配需要 Lv.30（当前 Lv.3）",
  "errors": { "level": ["需要 Lv.30 才能使用该权益"] }
}
```

### 2.18 装扮商城（目录 / 购买 / 切换，安全扫描 H-6）

- **接口**: `GET /api/user/skins`、`POST /api/user/skins/purchase`、`POST /api/user/skins/use`
- **认证**: 需要
- **说明**: 装扮目录、价格、VIP 门槛、所有权与扣款金额**全部由服务端决定**（目录见 `src/utils/skinCatalog.js`，共 26 项：头像框 8 / 身份标识 6 / 聊天气泡 6 / 主题皮肤 6）。
  客户端只提交 `skinId`，不再提交金额或拥有关系；状态存在 `xn_user_pref.data.skinShop`，读写都按目录过滤（目录外的历史伪造键直接丢弃）。
- **`GET /api/user/skins` 响应**: `200`
```json
{
  "code": 200,
  "data": {
    "balance": 20000,
    "lv": 50,
    "vipLevel": 0,
    "needLevel": 45,
    "unlocked": true,
    "types": ["frame", "badge", "bubble", "theme"],
    "items": [
      { "id": "sf8", "type": "frame", "name": "暗夜流光", "price": 8888, "vipLevel": 4,
        "vipOnly": true, "owned": false, "using": false,
        "assets": { "style": { "border": "4px solid #6c5ce7", "borderRadius": "10px" } } }
    ]
  }
}
```
  `items[].owned` 是服务端事实：付费项必须有服务端写入的购买记录，免费且非 VIP 的项（`price=0 && vipLevel=0`）无需记录即视为已拥有。
- **`POST /api/user/skins/purchase`**：请求体 `{ "skinId": "sf8" }`。执行顺序 = Lv.45 门槛 → VIP 门槛 → 事务内条件扣减（`WHERE money >= 目录价`）→ 写所有权并置为使用中（四类共用一个「使用中」位）。
  已拥有则**幂等**：不再扣款，仅切换使用中，`charged` 回 `0`。`skinId` 缺失或非字符串 → `400 缺少 skinId`。
- **`POST /api/user/skins/use`**：请求体 `{ "skinId": "sf2" }`。只能切换**服务端已记录为拥有**（或免费）的装扮；不扣款，因此不要求 Lv.45。
- **响应（成功）**: `200` `{ "code": 200, "message": "购买成功", "data": { "skin": { "id": "sf8", "type": "frame", "name": "暗夜流光", "price": 8888, "vipLevel": 4 }, "charged": 8888, "alreadyOwned": false, "balance": 11112 } }`
  文案随结果变化：`charged > 0` → 「购买成功」；免费/已拥有的领取 → 「已获得」；`use` → 「已切换」。`data.skin` 只回传 `id/type/name/price/vipLevel`，展示资源仍从 `GET /api/user/skins` 取。
- **响应（业务拒绝，均为 `422`）**: `errors.skin` 固定为原因码，前端据此提示、服务端据此可观测

| `errors.skin` | `message` | 触发条件 |
|---|---|---|
| `SKIN_NOT_FOUND` | 装扮不存在或已下架 | `skinId` 不在目录内（不开事务、不查门槛） |
| `SKIN_VIP_REQUIRED` | 需要 VIPn 及以上才可购买 | 目录项 `vipLevel > 0` 且账号有效 VIP 等级不足（在扣款**之前**判定） |
| `INSUFFICIENT_BALANCE` | 金币不足，请先充值 | 条件扣减未命中（余额不足或并发输掉），偏好写入一并回滚 |
| `SKIN_NOT_OWNED` | 尚未拥有该装扮，请先购买 | `use` 一个未拥有的付费装扮 |

- **响应（等级不足）**: `422` `{ "code": 422, "message": "等级不足：解锁装扮商城需要 Lv.45（当前 Lv.3）", "errors": { "level": ["需要 Lv.45 才能使用该权益"] } }`
- **其余异常**: `500`，`message` 为固定文案「购买装扮失败 / 切换装扮失败 / 获取装扮列表失败」，不回显内部异常。

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
        "isRevoked": false,
        "isRead": true,
        "expireAt": 0,
        "readAt": 0,
        "destroyAt": 0
      }
    ],
    "total": 100
  }
}
```
- **消息类型**: 0-文字, 1-语音, 2-图片, 3-视频, 4-位置, 5-语音, 6-礼物, 7-红包
  （与 `frontend/src/views/ChatRoom.vue` 的 `MESSAGE_TYPE_MAP`、`backend/src/services/chatService.js` 的媒体类型判定 `[2,3,5]` 对齐。说明：礼物/红包气泡当前在客户端本地渲染、不落 `xn_chat_log`，6/7 仅可能由「转发」路径写入，转发侧的既有映射偏差见《未完成事项清单》C-10）
- **撤回语义**: `isRevoked: true` 的消息服务端不再下发原文与媒体地址（`content` 为空串、`mediaUrl` 为 `null`），客户端应渲染「消息已撤回」占位；刷新或重进会话同样生效
- **时间自动撤回**: `expireAt > 0` 表示该消息到期后自动撤回（用户偏好 `privacy.autoRecall`，单位秒，0=关闭，上限 300）。到期判定在服务端：读接口即时按 `expireAt` 兜底，后台清理器每 60 秒把到期消息落库为 `is_revoked=1` 并回收媒体；客户端只按 `expireAt` 做展示倒计时，不是事实来源
- **已读自动销毁**: `destroyAt > 0` 表示该消息在对方读到后到期自动销毁（期限来自**发送方**的 `privacy.autoDestroy`，前端可选 20/30/60 秒）。到期后该消息**不再出现在历史消息里**，服务端清空内容并置 `is_del=1`；`readAt` 为首次被读时间。已被举报（`targetType=4`）的消息会冻结这两类期限，不会被自动销毁

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

- **响应**:
```json
{
  "code": 200,
  "data": {
    "messageId": 1001,
    "sendTime": 1715040000,
    "expireAt": 0
  }
}
```
- **说明**: `expireAt` 为到期自动撤回的绝对时间戳（秒），服务端按发送者的 `privacy.autoRecall` 计算；0 表示不自动撤回。对端通过 socket `private_message` 的同名字段拿到它

### 3.4 撤回消息

- **接口**: `POST /api/chat/revoke`
- **认证**: 需要
- **请求体**: `{ "messageId": "xxx" }`
- **行为**: 校验消息存在、属于当前用户、非礼物/红包（type 6/7）、发送时间 ≤ 120 秒；通过后置 `is_revoked=1` 并**清空 `content`**，媒体消息（type 2/3/5）同时清空 `vod_url` 并删除媒资登记；随后客户端通过 socket `revoke_message` 通知对端实时替换气泡
- **错误**: 消息不存在 → 404；`只能撤回自己发送的消息` / `礼物/红包消息不可撤回` / `消息超过2分钟，无法撤回` → 422

### 3.5 标记已读

- **接口**: `POST /api/chat/mark-read`
- **认证**: 需要
- **请求体**: `{ "targetUserId": 123 }`
- **响应**: `{ "code": 200, "data": { "destroyAt": 0 } }`
- **行为**: 把「对方发给我的未读消息」置为已读并写 `read_at`；若**发送方**开启了已读自动销毁，同时写入 `destroy_at = now + autoDestroy`，并在响应里返回同一个 `destroyAt`（0=不销毁）。读取方据此调度本地消失，并通过 socket `message:read` 把 `destroyAt` 转告发送方
- **说明**: 期限由发送方偏好决定（`xn_user_pref.data.privacy.autoDestroy`），读取方无法延长或缩短

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
- **入参校验（v6.23.0，安全扫描 M-6）**: `receiverId`/`giftId` 必填整数、`roomId` 可选整数、`count` 可选整数 1~100000000；数组/对象/布尔冒充数字、负数、超范围一律回 400；礼物数量与余额的关系仍由服务层判定。

### 4.3 获取礼物背包

- **接口**: `GET /api/gift/bag`
- **认证**: 需要

### 4.4 礼物提现

- **接口**: `POST /api/gift/withdraw`
- **认证**: 需要
- **请求体**: `{ "money": 200, "type": 1, "bankInfo": { "bank": "", "name": "", "mobile": "", "image": "" } }`（金额字段名为 `money`；控制器先判 `!money || money <= 0` → 400，再交服务端 `assertFiniteNumber`）
- **入参校验（v6.23.0，安全扫描 M-6）**: 边界层校验 `money` 为正有限数字（0.01~100000000）、`type` 为整数 1~3，数组/对象/布尔冒充数字、负数、超范围回 400；嵌套 `bankInfo` 本轮未做长度校验（`WITHDRAW_FIELD_LIMITS` 仅钱包渠道生效，属服务层遗留）
- **资金流（v6.8，安全扫描 C-2）**: 收礼时 `money` 与 `gift_money` **同时**入账，故提现申请在同一事务内**两笔都条件扣减**——`gift_money`（礼物收益可提现额度）与 `money`（真实余额）。
  历史实现只扣 `gift_money`，同一笔收益既能拿去消费又能全额提现，属资损。任一扣减未命中即整单回滚：
  `gift_money` 不足 → `可提现余额不足`；`money` 不足 → `金币余额不足，礼物收益已部分消费，无法全额提现`。
- **金额校验**: `assertFiniteNumber`——`"abc"`/`Infinity` 一律 422 拒绝（NaN 过去会穿透成 SQL 里的 `gift_money - NaN`）；最低 100 金币。
- **驳回退回**: 见 22.4，gift 渠道退回 `gift_money` + `money` 两笔。

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
| `/api/gift/redpacket/send` | POST | 发送红包（v6.23.0 起边界层校验：`totalAmount` 必填正有限数字、`totalNum` 必填整数 1~100、`type` 整数 ∈ 0/1、`roomId`/`receiverId` 整数、`message` ≤100 字符；金额 ≥1 的业务下限仍由服务层判定） |
| `/api/gift/redpacket/receive` | POST | 领取红包（请求体 `{ "packetNo": "..." }`，`packetNo` 必填字符串 1~64 字符，v6.24.0 起边界层校验；**领取全程单事务 + `SELECT ... FOR UPDATE` 锁定红包行**，并发不再超额发放，成功返回 `data.amount`，详见《后端开发文档》v6.22 的 2.5 章） |
| `/api/gift/redpacket/history` | GET | 红包记录 |

> **并发语义（v6.24.0 / M-7）**：`/api/gift/redpacket/receive` 已在单个事务内先锁红包行再计算金额——同一红包的并发领取被串行化，后到者读到的是已被扣减的 `remain_num`/`remain_amount`。**累计发放恒等于 `total_amount`**（拼手气为其余人各留 ≥1 分，最后一人取剩余全部；普通红包均分、不足部分留给最后一人）。失败语义不变：红包不存在/状态非 0/已过期/领自己的 → 422，名额已抢完 → 422「红包已被抢完」，重复领取 → 422「已领取过该红包」（数据库层 `(packet_id,user_id)` 唯一索引兜底）。

---

## 5. 支付模块 (`/api/pay`)

### 5.1 获取充值套餐

- **接口**: `GET /api/pay/packages`
- **认证**: 不需要

### 5.2 创建充值订单

- **接口**: `POST /api/pay/create-order`
- **认证**: 需要
- **请求体**: `{ "packageId": 1, "payType": 1 }`；`packageId` 必填（整数 1~2147483647，v6.23.0 起边界层校验，非整数/数组/超范围回 400「packageId必须是整数」）；`payType` 可选、**刻意不校验类型**（字符串 `"alipay"`/`"wechat"` 与数字 1/2/3 均可，controller 内部 `parseInt` 归一）

### 5.3 微信支付下单

- **接口**: `POST /api/pay/wx-order`
- **认证**: 需要
- **请求体**: `{ "packageId": 1, "tradeType": "NATIVE", "openid": "" }`；`packageId` 必填整数（v6.23.0 起边界层校验）；`tradeType` 可选：`NATIVE`（默认，扫码支付，返回 `code_url`）/ `JSAPI`（微信内网页支付，必须同时传 `openid`，当前公众号网页授权未接入）。
- **响应（v6.48）**: `data` = `{ orderId, orderNo, amount, tradeType, codeUrl, jsApiParams }`；`NATIVE` 时 `codeUrl` 为微信支付链接（前端渲染二维码），`jsApiParams` 为 `null`；`JSAPI` 时反之。
- **未配置（v6.48）**: 未配置 `WECHAT_APPID/MCHID/API_KEY` 时返回 **503**「微信支付未配置，请使用卡密充值」，不再伪装成业务 422；业务失败（套餐不存在等）仍 422。

### 5.4 微信支付回调

- **接口**: `POST /api/pay/wx-notify`
- **认证**: 不需要（微信服务端调用，凭 MD5 签名识别来源）
- **请求体上限**: 64KB，超出直接回 `FAIL`（未鉴权公网入口，防大报文拖垮进程）
- **校验链（v6.11，安全扫描 H-2）**: `return_code` → `sign` → `result_code` → `appid`/`mch_id` → `fee_type=CNY` → `total_fee` 与订单应付分值一致 → 原子占用订单后入账，任一环节不过都回 `FAIL`；已入账订单的重复通知回 `SUCCESS`（详见 5.9）

### 5.5 查询微信订单

- **接口**: `GET /api/pay/wx-query`
- **认证**: 需要
- **归属（v6.11）**: 先校验 `order_no` 属于当前登录用户，非本人 403、订单不存在 404，之后才向微信反查（原实现任何登录用户可用他人订单号探测支付状态）

### 5.6 关闭微信订单

- **接口**: `POST /api/pay/wx-close`
- **认证**: 需要
- **归属（v6.11）**: 同 5.5，先验归属再调平台关单（原实现任何人都能关掉别人正在支付的单）

### 5.7 查询订单状态

- **接口**: `GET /api/pay/order-status`
- **认证**: 需要
- **归属（v6.11）**: 查询条件为 `{ order_no, user_id: 当前登录用户 }`，查不到统一回 404「订单不存在」（不区分「不存在」与「不属于你」，避免订单号枚举）

### 5.8 卡券相关

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/pay/validate-card` | POST | 需要 | 验证卡券（2026-10-05 安全扫描 C-3 起改为需登录 + `cardLimiter` 限流，请求体必须同时带 `cardCode` 与 `cardPwd`） |
| `/api/pay/use-card` | POST | 需要 | 使用卡券（卡号 + 密码双项校验；事务内以 `status=0` 条件原子占用后入账；`cardLimiter` 限流） |
| `/api/pay/redeem-key` | POST | 需要 | 卡密兑换（25 位密钥即兑现凭证；`cardLimiter` 限流） |
| `/api/pay/wx-callback` | POST | **需要**（v6.11） | 客户端支付回执。2026-10-03 起必须经服务端反查订单确认后才入账，否则 403；v6.11 再加登录态与「订单属于本人」双重校验，入账改为原子幂等（详见 5.9） |
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

**卡密兑现口径（v6.9，安全扫描 C-3）**

- 请求体：`{ "cardCode": "DKXXXXXXXXXXXXXX", "cardPwd": "XXXXXXXXXXXX" }`；密钥链路为 `{ "key": "<25 位数字>" }`。
- 校验顺序（`/validate-card`、`/use-card` 同一条）：`cardCode`/`cardPwd` 均需非空（否则 422「请输入卡号和密码」，**不查库**）→ 按卡号取卡 → **比对 `card_password`** → 才看 `status`。
- 卡号不存在与密码错误回同一条 422「卡号或密码错误」，不再单独返回「密卡不存在」——旧口径下免登录的 `/validate-card` 就是一个「哪些卡号有效」的枚举 oracle。
- 密码比对：先 `sha256` 摘要再 `crypto.timingSafeEqual`，不用 `===`（长度与逐字符早退都会泄露信息）。
- 核销：`UPDATE xn_card SET status=1,use_time,use_user_id WHERE id=? AND status=0` + 影响行数判定，只有抢到的请求执行 `User.increment('money')`；入账金额取 `coin_amount`，为 0 时回落面值。

### 5.9 支付入账口径（安全扫描 H-2，v6.11）

两条入账路径（微信服务端通知 `/wx-notify`、客户端回执 `/wx-callback`）都收敛到同一个函数 `payService.settleRechargeOrder(order, verification)`，校验强度不再分叉。

**入账三步在同一事务内完成**

1. `UPDATE xn_order_chong SET status=1, pay_time=<now>, update_time=<now> WHERE id=<订单ID> AND status=0`，取影响行数；
2. 影响行数为 0 → 抛 `PAY_ORDER_ALREADY_SETTLED`（并发/重复通知抢输的一方），不执行加币；
3. 抢到的那笔执行 `User.increment('money', { by: order.coins, where: { id: order.user_id } })`。

入账金币只取下单时写进订单的 `coins`（服务端定价），**从不**由回执金额或请求体推导；平台回传的实付分值 `total_fee` 只用来与 `round(amount×100)` 比对，不一致直接拒绝。

**`verification` 载荷**

| 字段 | 来源 | 说明 |
|------|------|------|
| `verified` | 服务端校验通过后置 `true` | 不为 `true` 一律 `PAY_ORDER_UNVERIFIED`（服务层是最后一道闸，不依赖 controller） |
| `source` | `wechat-notify` / `wechat-query` / `local-unverified` | 只进日志，用于对账时区分入账依据 |
| `paidCents` | 微信通知的 `total_fee`、`orderquery` 回传的 `total_fee` | 与订单应付分值比对；本地联调路径无平台金额，跳过比对 |
| `transactionId` | 微信 `transaction_id` | 仅日志线索（`xn_order_chong` 无支付流水列可落库，见遗留） |

**`/api/pay/wx-callback` 错误分流**

| HTTP | 错误码 | 触发条件 |
|------|--------|----------|
| 400 | — | 缺 `payNo` |
| 401 | — | 未登录（v6.11 起该路由要求 `authMiddleware`） |
| 403 | `PAY_ORDER_FORBIDDEN` | 订单不属于当前登录用户 |
| 403 | `PAY_ORDER_UNVERIFIED` | 未经服务端反查确认（未配置微信参数、反查失败、`trade_state≠SUCCESS`、反查回来的 `out_trade_no` 与请求不一致） |
| 404 | `PAY_ORDER_NOT_FOUND` | 订单号不存在 |
| 422 | `PAY_ORDER_AMOUNT_MISMATCH` | 实付分值 ≠ 下单应付分值 |
| 200 | `PAY_ORDER_ALREADY_SETTLED` | 重复回执：按幂等成功返回 `data.duplicated=true`（钱已由先到的那笔事务加过一次） |
| 500 | 无 code | 意外故障（数据库异常等）——不伪装成 4xx 业务拒绝 |

**`/wx-notify` 应答约定**：只有真正入账（或幂等命中已入账）才回 `SUCCESS`；其余一律 `FAIL` 且**不改订单状态**，让微信按退避策略继续重发。原实现先 `order.update({status:1})` 再在失败时回 `FAIL`，重试时 `findOne({status:0})` 已查不到该单 → 订单被标成已支付却从不加币，形成永久丢单。

**本地联调开关**：`ALLOW_UNVERIFIED_PAY_CALLBACK=true` 且 `NODE_ENV≠production` 时跳过反查直接入账（`source='local-unverified'`、无 `paidCents`）；生产环境检测到该开关会打 error 并强制忽略。

**遗留**
1. 微信 V2 的 MD5 签名与 `parseXml` 正则都是权宜实现：签名算法本身无问题，但 V2 已停止新商户申请，迁移 V3 需要平台证书与 `AES-256-GCM` 解密回调，属独立改造项。
2. `xn_order_chong` 没有存平台流水号（`transaction_id`）与支付渠道单号的列，对账只能靠日志；补列需一次增量 DDL。
3. 支付宝：`config.alipay` 三项无代码使用，也没有下单/回调路由，因此除本地联调开关外支付宝充值无法入账（前端 `PaymentGateway.vue` 走 alipay 分支时会稳定收到 403 提示）。
4. 本轮新增/改写的 jest 用例：`services/payServiceSettle` +12 例、`services/wechatPayNotify` +11 例、`controllers/pay` +8 例改写 4 例，共 31 例；**本机 PATH 无 node/npm，全部未执行**。
- 生成（`POST /api/admin/cards`）：卡号 `DK` + 14 位、密码 12 位，字符集 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`（32 字符，去掉易混淆的 I/O）；密钥 25 位数字。三者逐字符取 `crypto.randomInt`，**不再用 `Math.random`**，卡号也不再以 `Date.now()` 开头；落库前一条 `Op.or` 查询同时查重卡号与密钥。
- **B-10（2026-10-20）已收口**：`card_password` 改为静态加密落库（宽列 + 存量明文就地加密，迁移 `20261020000001` 已接自动迁移第 13 步）；管理端列表/发卡响应与核销比较前解密，**对外契约不变**。历史卡密三件套由旧 `Math.random` 生成、熵偏低的问题属存量资产处置（建议作废未售存量后重新发卡），不会因本项改变。

---

## 6. 游戏模块 (`/api/games`)

### 6.1 获取游戏分类

- **接口**: `GET /api/games/categories`
- **认证**: 不需要

### 6.2 获取游戏陪玩师

- **接口**: `GET /api/games/companions`
- **认证**: 需要
- **响应字段（v6.49.0）**: 列表项新增 `sex`（0 保密/1 男/2 女），供交友页性别筛选；`GET /api/games/search` 同样返回。

### 6.3 游戏订单操作

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/games/push` | POST | 发布订单 |
| `/api/games/grab` | POST | 抢单 |
| `/api/games/start` | POST | 开始订单 |
| `/api/games/complete` | POST | 完成订单 |
| `/api/games/cancel` | POST | 取消订单 |
| `/api/games/orders` | GET | 获取订单列表 |

> **经验（v6.5）**：`POST /api/games/complete` 在分账事务**提交之后**给接单方（`companion_user_id`）+50 经验（`order_completed`，按 VIP 倍率入账）；该调用包 `try/catch` 仅记日志，经验写入失败不影响订单完成与分账。

> **并发（v6.16，安全扫描 H-7）**：`start`（`1→2`）、`complete`（`2→3`，含给陪玩师 `gift_money`/`gift_money_zong` 分账与 `income_total`/`order_num` 累加）、`appeal`（`1|2|3→5`）都改为**条件更新占位**，只有命中前态的请求才动钱，重复点击/并发重放不再重复分账；`complete` 的 `order_commission_rate` 改在事务内读取；`evaluate`（`6.8`）在事务内 `FOR UPDATE` 重读订单行与陪玩师资料行，同一单二次评价返回「该订单已评价」且不会再污染滚动平均分。`grab`/`cancel` 早已是条件更新（`B-02`），本轮未改。**遗留**：`appeal` 不改资金（完成后申诉只登记，裁决走后台人工）。

### 6.4 陪玩师申请

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/games/apply` | POST | 申请成为陪玩师；body 支持 `description/icon/voiceIntro/voiceTime/serviceType` 与 v6.50.0 新增 `city/skillLevel/zone/position/playType`（落 `xn_companion_profile` 对应列；`serviceType` 仅接受 `online`/`offline`，缺省或非法值时沿用原记录，无记录按 `online`；`voiceTime` 为录音秒数） |
| `/api/games/my-services` | GET | 我的服务列表，返回项含 `serviceType`（`online`/`offline`，无列时回落 `online`）与 `voiceIntro/voiceTime`，供编辑页沿用原类型与原语音时长；v6.50.0 起另返回 `city/skillLevel/zone/position/playType` |
| `/api/games/apply/status` | GET | 查询申请状态 |

### 6.5 陪玩师详情

- **接口**: `GET /api/games/companions/:companionId`
- **认证**: 需要
- **说明**: 获取单个陪玩师详细信息（评分/接单量/标签等）。
- **响应字段（v6.49.0）**: 新增 `sex`（0/1/2）与 `serviceType`（`online`/`offline`，缺省 `online`）；`gender` 保留兼容。

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
- **响应（v6.49.0）**: `data` 为数组，项含 `{ id, name, tagId, tagName, icon, sortOrder }`（`tagId/tagName` 为前端兼容别名）；只返回启用标签，按 `sort_order,id` 升序；无启用标签时为空数组。

### 7.2 获取帖子列表

- **接口**: `GET /api/circle/posts`
- **认证**: 可选
- **参数**: `?page=1&pageSize=10&tag=游戏` 或 `?tagId=1`（v6.49.0：`tag` 兼容标签名称，数字按 tagId 精确匹配；名称查不到返回空列表，不退化为全量）

### 7.3 获取帖子详情

- **接口**: `GET /api/circle/post/:id`
- **认证**: 可选

### 7.4 获取我的帖子

- **接口**: `GET /api/circle/my-posts`
- **认证**: 需要

### 7.5 获取评论

- **接口**: `GET /api/circle/comments`
- **认证**: 可选登录（`optionalAuth`）
- **参数**: `?postId=123&page=1&pageSize=20`
- **权限（v6.47）**: 公开动态匿名可读；密码/付费动态需已解锁，仅关注需已关注作者，私密仅作者本人——无权查看返回 **403**「无权查看该动态评论」

### 7.6 创建帖子

- **接口**: `POST /api/circle/create`
- **认证**: 需要
- **请求体**:
```json
{
  "content": "今天玩王者太开心了！",
  "images": ["url1", "url2"],
  "videos": [],
  "tagIds": [1],
  "location": "上海",
  "visibility": 0,
  "password": "",
  "price": 0
}
```
- **可见范围（v6.47）**: `visibility` 取值 **0 公开 / 1 仅关注 / 2 私密 / 3 密码查看 / 4 付费查看**（路由校验 0~4；落库 `is_private` 为 0/3/4/1/2，1/2 沿用历史值）。仅关注/私密不支持解锁与转发；密码/付费分别使用 `password`/`price`。
- **等级门槛（v6.5）**: `images` 过滤空值后仍有元素时，校验 `post_images` 权益（Lv.15），不足返回 `422`；**纯文字动态不受限**。
- **经验（v6.5）**: 创建成功后给作者 +20 经验（`post_created`，按 VIP 倍率入账）。该写入包在 `try/catch` 内并只记日志，经验失败不会让发帖失败。

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
- **参数**: `?companionId=123&date=2026-05-22&gameId=1`
- **includeDisabled（v6.47）**: 传 `1` 时同时返回已关闭（`status=2`）时段供陪玩师端管理；不传/其他值只返回可约（`status=0`）时段。已成交（`status=1`）永远不返回。

### 8.2 批量创建时间段

- **接口**: `POST /api/reserve/slots/batch`
- **认证**: 需要

### 8.3 切换时间段可用性

- **接口**: `POST /api/reserve/slots/toggle`
- **认证**: 需要
- **说明**: 在「可预约(0)」与「我已关闭(2)」之间切换。**v6.16 起两条新增拒绝**：`status=1`（已被预约成交）的时段直接返回「该时间段已被预约，不可修改」；并发下槽位状态已被其他请求改动时返回「时间槽状态已变更，请刷新后重试」（条件更新落败）。body 里的 `enabled` 服务端不消费，以当前状态为准翻转。

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
- **说明**: v6.16 起为条件更新（`WHERE id AND target_user_id AND status=0`），并发确认只有一次生效，落败方 422「预约状态不正确」（见 8.11 状态码口径）。

### 8.6 拒绝预约（陪玩师端）

- **接口**: `POST /api/reserve/reject`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`
- **说明**: v6.16 起「改预约单状态 + 释放时间槽」并入同一事务且先占位后释放，槽位释放只命中 `status=1` 的占用槽；占位失败整体回滚。

### 8.7 取消预约

- **接口**: `POST /api/reserve/cancel`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`
- **说明**: 退款比例按距预约开始时间计算（`>=24h` 全退、`>=12h` 退 50%、更晚不退）。v6.16 起退款只在 `status 0|1 → 4` 条件更新命中后执行，重复退款不再可能；响应仍为 `{ success, refundRate, refundAmount, price }`。

### 8.8 完成预约

- **接口**: `POST /api/reserve/complete`
- **认证**: 需要
- **请求体**: `{ "reserveId": "xxx" }`
- **说明**: 买卖双方任一方可发起。v6.16 起先抢占 `status 1 → 3`（条件更新里同时带 `[Op.or]: [{user_id},{target_user_id}]` 归属），命中方才按 `reserve_commission_rate` 给陪玩师 `gift_money`/`gift_money_zong` 入账，比例在事务内读取。

### 8.9 获取预约列表

- **接口**: `GET /api/reserve/list`
- **认证**: 需要
- **参数**: `?type=all&page=1&pageSize=10`

### 8.10 获取预约详情

- **接口**: `GET /api/reserve/detail`
- **认证**: 需要
- **参数**: `?reserveId=xxx`

### 8.11 预约状态机与并发口径（v6.16）

状态定义：`0 待确认 → 1 已确认 → 3 已完成`；`0 → 2 已拒绝`；`0|1 → 4 已取消`。时间槽 `xn_reserve_slot.status`：`0 可预约 / 1 已占用 / 2 陪玩师自行关闭`。

| 接口 | 迁移 | 占位方式 | 落败响应（HTTP 状态码按控制器实际实现） |
|------|------|----------|----------|
| `/api/reserve/create` | 槽位 `0→1` + 建单 + 扣款 | 事务内条件更新（早已如此） | **422**「该时间段不可预约」/「该时间段已被预约」/「余额不足」 |
| `/api/reserve/confirm` | `0→1` | `UPDATE ... WHERE id AND target_user_id AND status=0` | **422**「预约状态不正确」 |
| `/api/reserve/reject` | `0→2`（并释放槽位） | 同上，事务内 | **422**「预约状态不正确」 |
| `/api/reserve/cancel` | `0\|1→4`（并按比例退款） | `WHERE id AND user_id AND status IN (0,1)` | **422**「预约无法取消」 |
| `/api/reserve/complete` | `1→3`（并分账） | `WHERE id AND status=1 AND (user_id=? OR target_user_id=?)` | **422**「预约状态不正确，仅可完成已确认的预约」 |
| `/api/reserve/slots/toggle` | `0⇄2`（`1` 拒绝） | `WHERE id AND user_id AND status=<读取时状态>` | **422**「该时间段已被预约，不可修改」/「时间槽状态已变更，请刷新后重试」 |

> ⚠️ **状态码口径（本轮静态复核控制器代码后校正）**：`controllers/reserve.js` 的业务错误一律 `response.unprocessableEntity` → **422**（`createReserve`/`confirm`/`reject`/`cancel`/`complete`/`toggleSlot` 六处），缺参数的校验分支才是 `badRequest` → 400；游戏订单侧 `createOrder`/`grab`/`start`/`complete`/`cancel`/`appeal`/`toggle-service` 同样 422，**唯一例外是 `/api/games/evaluate`**——`controllers/games.js:205-221` 只分流 404「订单不存在」与 403「无权评价他人订单」，其余（含本轮新增的「该订单已评价」）走 `response.error` → **500**（`utils/response.js` 的 `_isSafeMessage` 放行 ≤80 字的中文业务串，故文案仍直达用户）。控制器错误分类不一致属历史遗留，本轮只记录未改。

> 判据统一为 `Model.update(..., { where: { id, status: <期望前态> } })` 的**影响行数**（不是实例 `save`）：命中者才允许动钱，未命中者抛错并 `rollback`。这与 H-2（支付回调）、C-2（提现）、H-6（装扮扣款）用的是同一套写法，`cancelOrder` 早已如此，本轮把遗漏的分支补齐。

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
| `/api/trtc/auth` | GET | 需要 | 获取TRTC进房票据（**必须带 `roomId`**，见 11.4） |
| `/api/trtc/start` | POST | 需要 | 发起通话（同时分配不与他人通话冲突的 `trtcRoomId`） |
| `/api/trtc/cancel` | POST | 需要 | 取消通话 |
| `/api/trtc/reject` | POST | 需要 | 拒绝通话 |
| `/api/trtc/accept` | POST | 需要 | 接受通话 |
| `/api/trtc/end` | POST | 需要 | 结束通话 |
| `/api/trtc/history` | GET | 需要 | 通话记录 |

### 11.2 TRTC 房间管理

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/trtc/room/create` | POST | 需要 | 创建TRTC房间（当前实现不落库，仅返回占位对象，见 11.4 遗留） |
| `/api/trtc/room/enter` | POST | 需要 | 进入TRTC房间（需为该通话双方之一） |
| `/api/trtc/room/leave` | POST | 需要 | 离开TRTC房间（需为该通话双方之一，通话已结束仍可离房） |
| `/api/trtc/room/:roomId` | GET | 需要 | 获取房间信息（需为该通话双方之一，返回真实状态） |

### 11.3 通话计费

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/trtc/billing/start` | POST | 需要 | 开始通话计费（需为该通话双方之一且通话进行中） |
| `/api/trtc/billing/end` | POST | 需要 | 结束通话计费 |

### 11.4 进房票据与房间成员校验（安全扫描 C-4）

**背景**：本项目没有「房间表」，通话房间的唯一真相来源是 `xn_call_record`
（`trtc_room_id` + `caller_id` + `callee_id`，由 `POST /api/trtc/start` 即 `callBillingService.startCall` 写入）。
修复前 `GET /auth` 对任何登录用户无条件发放 UserSig，而「进哪个房间」完全由前端 URL 参数（`?room=`）决定，
`room/enter`、`room/:roomId` 也只做字符串拼接式返回——等于服务端对通话房间不设防，
任何人拿到或猜到一个房间号就能进别人的通话、读到房间状态。

**`GET /api/trtc/auth`**

| 入参 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `roomId` | query | 否 | 要进入的 TRTC 房间号（数字，来自 `start` 响应的 `trtcRoomId` 或来电 `call_invite` 的 `trtcRoomId`） |

- **不传 `roomId`**：`200` + `{ configured:true, appId, sdkAppId, userId, expireTime, userSig:null, requiresRoomId:true }`。
  这个形态只用于「通道是否开通」探测（`callService.isTRTCAvailable()`），不再给出可用票据。
- **传 `roomId`**：服务端按 `trtc_room_id` 查 `xn_call_record`（`ORDER BY status ASC, create_time DESC`，
  优先命中仍在进行的通话），确认请求者是 `caller_id` 或 `callee_id` 且 `status ∈ {0 呼叫中, 1 已接通}` 后才签发 `userSig`。
- **TRTC 未配置**：仍是 `200` + `configured:false`（语义是「通道未开通」，不是服务故障，因此不用 503/500，避免被 5xx 监控规则误判），前端自动降级 WebRTC。

错误语义（`auth` / `room/enter` / `room/leave` / `room/:roomId` / `billing/start` 共用同一分流函数）：

| HTTP | 触发条件 | message |
|------|----------|---------|
| 400 | `roomId`（或 `billingId`）为空 | 房间ID不能为空 |
| 403 | 请求者不是这通电话的主叫/被叫 | 无权进入该房间 |
| 404 | 该房间号没有任何通话记录 | 房间不存在或已过期 |
| 422 | 通话已是 2/3/4/5（拒绝、取消、结束、无应答），或房间号不是正整数 | 通话已结束，无法进入该房间 / 房间号格式不正确 |
| 500 | 其他意外异常（数据库故障等），不伪装成业务拒绝 | 服务器内部错误 |

**房间号分配**：`startCall` 改用 `crypto.randomInt(1, 1000000)` 生成候选号，并对 `status ∈ {0,1}` 的通话查重，
最多重试 5 次；仍冲突则返回 422「通话房间号分配失败，请稍后重试」，不建单。
原实现 `Math.floor(Math.random()*1000000)+1` 不查重，两通电话撞同一个房间号就会互相串音串画。

**前端配套改动**（详见《前端技术文档》v7.14）：`trtcService.getAuth(roomId)` 透传房间号；
`trtcRoomService.join()` 先校验 `roomId` 再申领票据，并把后端 message 抛给通话页；
`callService.isTRTCAvailable()` 探测不再要求响应里带 `userSig`（只看 `configured` + `appId`）。

**遗留（本次未收口，按风险排序）**：
1. 进房票据仍是**房间无关的普通 UserSig**，服务端靠「签发前查成员」拦截，而非用腾讯 PrivateMapKey 绑定房间。
   代码里的 `generateRoomSig` 实现的是官方**字符串房间号** userbuf 布局，而前端 `trtc.enterRoom({ roomId: Number(roomId) })` 进的是数字房间，
   两者不匹配；数字房间的 userbuf 字节布局无法离线验证（需要真实密钥 + SDK 联调），贸然切换会打断所有真实通话，故保持现状。
2. `POST /room/create` 与 `/billing/*` 仍是「返回随机对象、从不落库」的占位实现，前端无调用方；`billing/end` 返回随机时长。
3. Socket 层的 `call_invite` / `call_accept` / `webrtc_signal` 转发仍信任客户端上报的 `toId`，属于另一条待收口的越权面（记入 H 项）。

---

## 12. VIP会员模块 (`/api/vip`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/vip/packages` | GET | 不需要 | VIP套餐列表 |
| `/api/vip/info` | GET | 需要 | 用户VIP信息 |
| `/api/vip/order` | POST | 需要 | 创建VIP订单（`packageId` 唯一入参，v6.23.0 起边界层校验为整数 1~2147483647；价格/时长取服务端 `xn_vip_package`，2026-10-04 起忽略前端 `months`/`price`） |
| `/api/vip/order/complete` | POST | 需要 | 完成VIP订单（2026-10-04 起按 `req.userId` 校验订单归属，并在事务内条件扣金币 `money >= price`，余额不足回滚返回 422「余额不足」） |
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

> **相册容量（v6.5）**：`POST /api/album/upload` 先按等级取额度（`album_expand` Lv.25 以下 20 张、以上 50 张），超限返回 `422`，消息形如 `相册最多 20 张，Lv.25 可扩容至 50 张`（`errors.album`）。计数为 `xn_album_photo` 中该用户的记录数。

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

**举报目标类型（`targetType`）**：`1`=用户、`2`=动态、`3`=评论、`4`=聊天消息（`targetId` 传消息 ID）。
`targetType=4` 时服务端会校验：必须是会话参与方、不能举报自己发送的消息、已撤回/已销毁的消息不可举报；举报成功后**冻结该消息的 `expire_at` 与 `destroy_at`**（置 0），避免管理员核查时内容已被自动清理。

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

- **过滤规则**：`status=1`，`start_time` 为 0（立即生效）或 `<= now`，`end_time` 为 0（永不结束）或 `>= now`，按 `sort DESC, created_at DESC` 取前 5 条。
- **`?frequency=`（可选）**：逗号分隔的频率白名单，服务端始终附加 `1`（每次打开）；不传即 `all`，返回全部频率档位。
- **响应**：`{ "code": 200, "data": { "list": [ { "id", "title", "image", "link", "frequency", "start_time", "end_time", "sort" } ] } }`
- **`frequency` 语义**：1 每次打开 / 2 每天一次 / 3 每周一次 / 4 仅一次。**去重由客户端完成**（`frontend/src/utils/splashScreen.js` 用 `localStorage` 记 `splash_shown:<id>` 的自然日/自然周/一次性档位），一次启动只弹排序最靠前的一条。
- **C 端接线（2026-10-04）**：`App.vue` 启动时经 `homeService.getSplashList()` 调用本接口，由 `components/SplashPopup.vue` 展示；后台在 `AdminSplashCarousel`（`/api/admin/splashes*`，权限 `splash:read` / `splash:write`）配置投放内容与时间窗。

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
| `/api/search/users` | GET | 可选 | 普通用户搜索（v6.50.0）：`?keyword=xxx&page=1&pageSize=10`；昵称模糊、排除自己、遵守 `allowSearch` 隐私开关；返回 `{ total,page,pageSize,totalPages,list:[{userId,nickname,avatar,level,sex,fansCount}] }` |

### 16.11 公告模块 (`/api/notice`)（v6.38.0，B-3/B-4）

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/notice/list` | GET | 不需要 | 公告列表。查询参数 `page`/`pageSize`（1~100）；返回 `{ list: [{ id, title, content, type, status, pinned, startTime, endTime, createTime, updateTime }], pagination }`。只返回 `status=1` 且 `start_time<=now<=end_time`（0 表示不限）的记录，`pinned DESC, create_time DESC`；表未迁移/DB 短暂不可用时降级为空列表 |

后台维护接口见 22.2b；socket 全服事件 `notice_created`/`notice_updated`（负载 `{ notice }`）与 `notice_deleted`（负载 `{ id }`）。

### 22.2b 公告管理 `/api/admin/notices`（v6.38.0，B-3/B-4）

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/notices` | GET | splash:read | 列表。`status`（0/1）、`keyword`（标题模糊）、`page`、`pageSize` |
| `/api/admin/notices/:id` | GET | splash:read | 详情 |
| `/api/admin/notices` | POST | splash:write | 新增。必填 `title`/`content`；可选 `type`(notice/activity/system)、`status`(0/1)、`pinned`(0/1)、`startTime`/`endTime`（秒级时间戳，0=不限）。status=1 时广播 `notice_created` |
| `/api/admin/notices/:id` | PUT | splash:write | 部分更新（未传字段保留原值）。发布中广播 `notice_updated`，下线广播 `notice_deleted` |
| `/api/admin/notices/:id` | DELETE | splash:write | 删除并广播 `notice_deleted` |

### 16.12 意见反馈模块 (`/api/feedback`)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/feedback/submit` | POST | 需要 | 提交意见反馈 |
| `/api/feedback/my` | GET | 需要 | 我的反馈记录 |

---

## 17. WebSocket 实时通讯

### 17.1 连接

- **地址**: 后端根地址（默认命名空间 `/`，`socket/index.js` 未定义 `/chat` 等自定义命名空间）
- **认证**: 通过握手 `auth.token` 参数传递 JWT（无效/匿名连接将被拒绝）。H-4 起只接受 `type=access` 的用户访问令牌，refresh 或管理员令牌握手一律 `UNAUTHORIZED`。
- **重连**: 客户端指数退避自动重连；服务端通过 `@socket.io/redis-adapter` 支持多实例横向扩展

### 17.2 客户端事件（17 个）

| 事件 | 说明 | 数据 |
|------|------|------|
| `private_message` | 发送私聊消息（落库 `xn_chat_log`） | `{ toId, content, type, mediaUrl, duration }` |
| `call_invite` | 发起通话邀请 | `{ toId, callType, trtcRoomId, callId, useWebRTC }` |
| `call_cancel` | 取消通话邀请 | `{ toId }` |
| `call_reject` | 拒绝通话 | `{ toId }` |
| `call_accept` | 接受通话 | `{ toId, trtcRoomId }` |
| `call_end` | 结束通话 | `{ toId, duration }` |
| `webrtc_offer` | WebRTC Offer | `{ toId, sdp }` |
| `webrtc_answer` | WebRTC Answer | `{ toId, sdp }` |
| `webrtc_ice_candidate` | WebRTC ICE候选 | `{ toId, candidate }` |
| `typing` | 打字状态推送 | `{ toId }` |
| `message:read` | 已读回执（v6.35）：通知对方把自己发出的气泡置为已读 | `{ fromUserId, destroyAt }`（`fromUserId`=对方 ID；`destroyAt` 仅 UI 倒计时，服务端夹取到 `(now, now+300]`，非法值置 0） |
| `revoke_message` | 消息撤回（对端收到 `message_revoked`；B-16 起要求消息已落库撤回、由本人发出且收件人为 `toId`，否则静默丢弃） | `{ toId, messageId }` |
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
| `typing` | 对方正在输入 | `{ fromId, fromName }` |
| `message:read` | 已读回执转发（v6.35）：`fromUserId` 为「读消息的人」，接收方据此把自己发出的气泡置为已读 | `{ fromUserId, destroyAt }`（`destroyAt` 已由服务端夹取） |
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
| `notice_created` | 公告发布全服广播（v6.38，管理员发布公告时经 `broadcastToAll` 全服 emit） | `{ notice }` |
| `notice_updated` | 公告更新全服广播（v6.38；更新后已发布才广播，下线改发 deleted） | `{ notice }` |
| `notice_deleted` | 公告下线/删除全服广播（v6.38） | `{ id }` |

> 另有通用 `error` 事件（`{ message }`）用于操作失败回执。
>
> **2026-10-20 校正（文档整治）**：`room_message`/`join_room`/`leave_room` 及对应服务端回执在 `src/socket/index.js` 中**从未实现**（房间能力只有 `user:<id>` 定向房间，无 `room:<roomId>` 的 join/广播实现），已从两张表移除；新增行均有代码依据——`message:read` 见 `socket/index.js`（v6.35），`notice_*` 见 `controllers/admin.js` 的 `createNotice`/`updateNotice`/`deleteNotice`（v6.38，经 `socket/index.js` 的 `broadcastToAll` 全服 emit）。

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
| `exp` | INT | 当前等级内已积累的经验值（默认 0；升级后只保留结转部分，非累计） | `GET /api/user/level` 的 `exp/remainExp/percent` | ✅ 一致（v6.5 新增列） |
| `last_check_in_time` | INT(10) | 最近一次每日签到时间戳，默认 0（表示从未签到） | `checkedInToday` | ✅ 一致（v6.5 新增列） |
| `level_backfill_time` | INT(10) | 历史经验回填完成时间戳，0 表示尚未回填（回填幂等标记） | —（内部字段，不下发） | ✅ 一致（v6.5 新增列） |
| `create_time` | INT | 创建时间 | createTime | ✅ 一致 |
| `last_login_time` | INT | 最后登录时间 | lastLoginTime | ✅ 一致 |

> **等级经验链路（v6.5）**：`lv` 由「只读不写」改为可写字段。三列由幂等迁移 `backend/src/migrations/20261004000001_add_user_exp_and_backfill.js` 添加（`INFORMATION_SCHEMA` 检查列是否存在，缺失才 `ALTER TABLE`；注册为 `runMigrations.js` 第 9 步，重复启动安全）。同一迁移按历史行为一次性折算基线等级：`作为接单方的已完成订单数(status=3) × 50 + 发布动态数 × 20 + (real_name_status=2 ? 100 : 0)`，从 Lv.1/0 起算（不乘 VIP 倍率），只处理 `level_backfill_time = 0 且 exp = 0` 的账号，分批 200 条、支持 `dryRun`。**为什么必须回填**：`lv` 自上线来从未写入，全部账号为 Lv.1，Lv.5~Lv.45 的权益门槛一旦生效会把存量用户全部锁在外面。

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
| 群聊 | `/api/chat/room/*` | 2026-10-03 移除（`room_message`/`join_room`/`leave_room` 事件与 `ChatRoom` 模型一并删除；`xn_chat_room` 表保留，它是 `ChatSession` 的会话表） |
| 服务管理/项目 | `/api/project` | 2026-10-03 移除（后端内存 mock 路由、前端三项页面与 `projectService.js` 均已删除；23 章表格仅作历史留存） |

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
>
> 分页口径（v6.39.0，B-12）：所有列表 GET 统一校验 `page`（1~100000）与 `pageSize`（1~100），非整数/越界返回 400；各接口的业务过滤字段（`status`/`keyword`/`role` 等）仍按模块语义分别校验。
>
> **H-4 认证口径**：`adminAuth` 只接受 `type=admin` 的管理员令牌，或 `ADMIN_TOKEN` 配置的固定应急令牌（`x-admin-token` 或 `Authorization: Bearer` 两个候选位都可传）；用户端 `access`、`refresh` 以及管理员自己的 `admin_refresh` 令牌在此一律 403「无管理员权限」。v6.20.0（M-2）起，通过 `type=admin` 校验的令牌还会按 `adminScope` **实时回读** `xn_admin`/`xn_admin_role` 主体（删号 → 401、禁用 → 403、权限/角色取库内当前值），`ADMIN_TOKEN` 固定令牌走 `id=0` 超管口径、不进回读，详见 22.1「会话终止」。

### 22.1 管理员登录

- **接口**: `POST /api/admin/login`（另有同义入口 `POST /api/admin-manage/login`，见 22.19）
- **认证**: 不需要
- **请求体**: `{ "username": "xxx", "password": "xxx" }`
- **响应**: `{ "code": 200, "message": "登录成功", "data": { "token": "xxx", "refreshToken": "xxx", "expiresIn": "12h", "user": { "id": 1, "username": "admin", "nickname": "超级管理员", "role": "admin", "role_id": 2, "permissions": ["all"], "avatar": "" } } }`
  - 返回的是 `data.user` 对象，**没有** `adminId`/`username` 平铺字段（此前文档写法与代码不符，v6.12 校正）。**v6.36.0（B-5）起 `/api/admin/login` 与 `/api/admin-manage/login` 一样同时下发 `refreshToken` 与 `expiresIn`**；先前「/api/admin/login 只发 token」的口径作废。应急账号（`adminScope=emergency`）不下发 refresh（无可回读主体、不可吊销）。
- **令牌时效（v6.20.0，M-2）**: 访问令牌默认 **12 小时**，由新配置项 `ADMIN_JWT_EXPIRES_IN` 控制（支持 `s/m/h/d`，如 `'2h'`、`'1d'`），不再与用户端共用 `JWT_EXPIRES_IN`（后者默认 7 天）。令牌 payload 含 `adminScope`（`account`/`role`/`emergency`，标明 `id` 指向 `xn_admin`、`xn_admin_role` 还是应急账号），`adminAuth` 据此实时回读——**升级后无 `adminScope` 的存量令牌一律 401，需重新登录一次**。
- **口令口径**: 数据库账号（`xn_admin`，`status=1` 才可登录）→ 角色账号（`xn_admin_role` 自带用户名/密码时）→ 环境变量应急账号（必须 `ADMIN_EMERGENCY_LOGIN=true` 且配了 `ADMIN_USERNAME`/`ADMIN_PASSWORD`，否则不生效）。三者都不过才回 401。
- **防爆破（安全扫描 H-3，v6.12）**：两道叠加
  1. **单 IP**：`adminLoginLimiter`，15 分钟 5 次（`ADMIN_LOGIN_RATE_LIMIT_MAX` 可调），超了直接 429 `后台登录尝试次数过多，请15分钟后再试`。此前后台登录只吃全局 `apiLimiter`（代码默认 100 次/分钟，`.env` 配的是 1000 次/15 分钟，且 `NODE_ENV=development` 时整体豁免），等于允许在线爆破；本限流器**不豁免开发环境**，本地联调也能看到同一条行为（v6.17 起六个限流器统一没有环境豁免，见 1.7）。
  2. **单账号**：`services/adminLoginGuard.js`，Redis 键 `admin:login:fail:<归一化账号>`，连续失败 `ADMIN_LOGIN_MAX_FAILS`（默认 5）次即锁 15 分钟；账号名先 `trim().toLowerCase()` 归一，避免大小写变体绕开计数。**不存在的用户名同样计数**，否则「会不会被锁」就成了账号存在性 oracle。成功登录即清计数。
- **错误码**: 400 用户名或密码为空（**不计失败**，防止任何人用空请求锁死他人账号）；401 用户名或密码错误（计一次失败，文案统一不区分账号是否存在）；403 账号已被禁用（仅 `/admin-manage/login`，不计次）；429 该账号已锁定，`data.retryAfterSec` 为剩余秒数；503 Redis 不可用、无法确认锁定状态时**保守拒绝**（口令校验不因缓存抖动降级）；500 其它意外故障。
- **管理端前端**：`admin-frontend/src/common/common.js` 的 `request()` 此前把 429/503 一律吞成「请求失败 (429)」，本轮改为透传后端 `message`，管理员能直接看到「请 N 分钟后再试」。
- **刷新令牌（v6.36.0，修复 B-5）**：`POST /api/admin/refresh-token`，认证不需要，请求体 `{ "refreshToken": "xxx" }`，响应同登录（新 `token`/`refreshToken`/`expiresIn`/`user`）。服务端只认 `type=admin_refresh`；先查吊销（Redis 不可确认时生产 fail-closed 503），再按 `adminScope` 回读 `xn_admin`/`xn_admin_role` 实时主体（禁用/删除即 401）并重算权限；**轮换**：签发新对之前把旧 refresh 拉黑，无法确认作废时生产不签发新令牌。`adminScope=emergency`/`legacy` 一律 401 强制重登。
- **登出（v6.14.0，修复 H-5）**：`POST /api/admin/logout`（需 `adminAuth`；`/api/admin-manage/logout` 是同一实现的另一个入口）。吊销的是**本次请求实际通过校验的那一枚令牌**——`adminAuth` 支持 `Authorization: Bearer` 与 `x-admin-token` 两种传递方式，所以中间件把命中的原文留在 `req.adminToken` 上，登出不能靠猜。可选 `body.refreshToken` 仅在 `type=admin_refresh` 且 `id` 归属当前管理员时才拉黑。响应 `{ code:200, data:{ clientShouldClearToken:true, revocable:true, serverRevoked:true } }`；用 `ADMIN_TOKEN` 环境变量应急令牌登录时走 `revocable:false` 分支（固定字符串无 `exp`、无签名，吊销名单管不到它，只能清前端本地态）。生产环境吊销写不进时返回 503 且不假装已登出，非生产 fail-open 并回 `serverRevoked:false`。
- **会话终止（v6.14.0 修复 H-5；v6.20.0 起叠加 M-2 实时回读）**：历史上 `adminAuth` 只验令牌、不回查 `xn_admin`，权限与状态都是登录快照，「改口令 / 禁用 / 删除管理员」踢不掉已到手的令牌，现在是两道防线叠加：①**吊销水位线（H-5）**——`PUT /api/admin-manage/admins/:id/password`、禁用 `PUT .../:id`（`status≠1`）、`DELETE .../:id` 三处在改库**之前**写 `auth:revoke-admin:<id>`（`iat` 早于水位线的令牌一律拒绝），响应带 `data.sessionsRevoked`。顺序不能反：生产确认不了吊销就不改库（503），避免「密码已换、旧令牌照常能用」或「查无此人但仍可操作」。②**实时回读（v6.20.0，M-2）**——`adminAuth` 每次请求按 `adminScope` 回读主体：管理员被删除 → 401「令牌已失效」，被禁用 → 403「账号已被禁用」，`permissions`/`role_id` 以数据库当前值为准——**改权限/换角色/禁用下一个请求立即生效，无需重新登录**。分工：改口令后旧令牌的收口仍**只**靠①（回读不校验口令版本，`password` 接口的吊销不能省）；删号/禁用为①+②双保险（非生产吊销 fail-open 失败时，②仍会拦下）。改权限/角色**不**吊销令牌（避免管理员改自己权限时把自己踢下线），改库即生效。

### 22.1b 实名审核 `/api/admin/real-names`（v6.37.0，B-2）

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/real-names` | GET | user:read | 列表。查询参数 `status`（0~3，缺省=1+3 待处理）、`keyword`（用户ID精确/昵称模糊）、`page`、`pageSize`（1~100）。返回 `{ list, pagination }`，列表中的姓名/证件号已脱敏，**不含**证件照 |
| `/api/admin/real-names/:id` | GET | user:read | 详情。在列表字段基础上返回解密后的 `front`/`back` 证件照 URL（供审核比对） |
| `/api/admin/real-names/:id/review` | PUT | user:write | 审核。请求体 `{ "action": "approve" \| "reject" }`。approve：`real_name_status` 1/3 → 2，并通过 `levelService.addExp(用户, 'real_name_verified')` 发放 100 基础经验（× VIP 倍率），响应 `{ userId, status: 2, expGranted, exp: { added, lv, exp, leveledUp } }`；reject：状态置 3，不发放经验。错误：400 动作非法、404 用户不存在、**409** 已认证（不会重复加经验）/状态不可审核（并发条件更新未命中） |

### 22.2 用户管理 `/api/admin/users`

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/admin/users` | GET | user:read | 用户列表（分页/搜索） |
| `/api/admin/users/:id` | GET | user:read | 用户详情 |
| `/api/admin/users` | POST | user:write | 创建用户 |
| `/api/admin/users/:id` | PUT | user:write | 更新用户 |
| `/api/admin/users/:id/status` | PUT | user:write | 更新用户状态（封禁/解封）。封号时顺带作废该用户全部会话（v6.14 H-5，尽力而为：`authMiddleware` 每请求回查 `xn_user.status`，封号本身已生效，吊销失败只记日志） |
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

**审核资金流（v6.8，安全扫描 C-2）**

- `approve` / `reject` 都用**条件更新**推进状态：`UPDATE xn_withdraw SET ... WHERE id=? AND is_check=0`，以影响行数判定，
  抢不到行的并发请求（两个管理员同时点、或重复点击）返回 400「该提现记录状态不允许操作」，不会重复退款。
  历史实现是「先 `findByPk` 判 `is_check`、再 `instance.update`」，两条语句之间存在窗口。
- 提现单在**用户申请时**就已扣款，`approve` 只推进状态、不再动余额。
- `reject` 按渠道原路退回，与扣减口径一一对应：

| channel | 申请时扣减 | 驳回退回 |
|---------|-----------|---------|
| `wallet`（`POST /api/wallet/withdraw`） | `money` | `money`（v6.8 起；此前该渠道从不扣款，也就不需要退） |
| `gift`（`POST /api/gift/withdraw`） | `gift_money` + `money` | 两笔都退 |
| `admin`（`POST /api/admin/withdraws`） | `money` | `money` |
| 空值（历史数据） | 按 `gift` 口径处理（`xn_withdraw.channel` 列 `DEFAULT 'gift'`） | 同 `gift` |

- `POST /api/admin/withdraws` 建单即在事务内条件扣减 `money`（审计 B-08 已修），余额不足返回 422。请求体 `{ userId, amount, type?, account? }`，v6.23.0 起边界层校验：`userId` 必填整数、`amount` 必填正有限数字（0.01~1e8）、`type` 可选整数 1~3、`account` 可选 ≤255 字符，非法值回 400（校验在 `adminAuth` + `withdraw:write` 之后）。

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
| `/api/admin/cards` | GET | card:read | 卡密列表（响应含 `cardNo`/`cardPwd`/`cardKey`，发卡方需据此告知用户） |
| `/api/admin/cards` | POST | card:write | 创建卡密（v6.9 起三件套用 `crypto.randomInt` 生成，见 5.8「卡密兑现口径」；`count` 上限 100） |
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
| `/api/admin-manage/login` | POST | 不需要 | 管理员登录。与 22.1 **共用同一套防爆破**（`adminLoginLimiter` + `adminLoginGuard` 的同一 Redis 计数键），从哪个入口爆破都会锁住账号；响应额外带 `refreshToken`（H-4 起其 `type=admin_refresh`，当前无服务端消费入口）；禁用账号回 403 且不计失败次数；v6.20（M-2）：访问令牌改用 `ADMIN_JWT_EXPIRES_IN`（默认 12h）并携带 `adminScope`，`adminAuth` 据此实时回读（见 22.1「令牌时效」「会话终止」） |
| `/api/admin-manage/current` | GET | adminAuth | 当前登录管理员 |
| `/api/admin-manage/logout` | POST | adminAuth | 服务端登出，与 22.1 的 `/api/admin/logout` 同一实现（吊销本次命中的令牌，可选 `body.refreshToken` 需归属本人） |
| `/api/admin-manage/admins` | GET | admin:write | 管理员列表 |
| `/api/admin-manage/admins` | POST | admin:write | 创建管理员。v6.19（M-1）：授予的 `permissions` 须 ⊆ 自身、所选角色须在可管理范围内（**缺省角色 2 同样校验**，此前「不传 `role_id`」可绕过角色检查），超出回 403 |
| `/api/admin-manage/admins/:id` | PUT | admin:write | 更新管理员。`status` 改为非 1（禁用）时先作废该账号全部会话再改库（v6.14 H-5）；改 `permissions`/`role_id` **不**吊销在用令牌（避免管理员改自己权限时把自己踢下线），但 v6.20（M-2）起 `adminAuth` 每请求实时回读——改权限/换角色/禁用都在**下一个请求**立即生效、无需重新登录，被禁用者回 403「账号已被禁用」；v6.19（M-1）：目标账号与提交的授予集都须在本账号可管理范围内，超出回 403 |
| `/api/admin-manage/admins/:id/password` | PUT | admin:write | 修改管理员密码。改库前先全端下线，响应 `data.sessionsRevoked`；生产吊销确认不了则 503 且不改密（v6.14 H-5）——v6.20（M-2）实时回读**不校验口令版本**，这里的吊销仍是改密后踢掉旧令牌的唯一机制，不可省；v6.19（M-1）：非超管不能重置「超出自身管理范围」的管理员口令（403） |
| `/api/admin-manage/admins/:id` | DELETE | admin:write | 删除管理员。先作废其全部会话再删行，生产吊销不了则 503 不删，避免「查无此人但仍可操作」（v6.14 H-5）；v6.20（M-2）：即便非生产吊销 fail-open 放行，删行后 `adminAuth` 实时回读查无此人也会立即 401「令牌已失效」（双保险）；v6.19（M-1）：非超管不能删除「超出自身管理范围」的管理员（403） |

### 22.20 角色与权限 `/api/admin-manage`

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/admin-manage/roles` | GET | admin:write | 角色列表 |
| `/api/admin-manage/roles` | POST | admin:write | 创建角色。v6.19（M-1）：非超管提交的 `permissions` 须 ⊆ 自身（403「无权授予超出自身权限范围的权限: <列表>」） |
| `/api/admin-manage/roles/:id` | PUT | admin:write | 更新角色。v6.19（M-1）：非超管不能修改超管角色（`id=1`/`is_super`）或权限超出自身的角色（403「无权修改该角色：超出自身权限范围」），改 `permissions` 同样不超自身 |
| `/api/admin-manage/roles/:id` | DELETE | admin:write | 删除角色。v6.19（M-1）：非超管不能删除超管角色或权限超出自身的角色（403「无权删除该角色：超出自身权限范围」） |
| `/api/admin-manage/permissions` | GET | admin:write | 权限列表。v6.44.0：`data` 为 `{ modules, permissions }`——`modules` 是 19 个模块 id（旧结构兼容），`permissions` 是 `utils/permissions.js` 的权限键真源（`[{ key: "user:read", label: "查看用户" }, ...]`），管理端 `AdminRoles.vue` 用它渲染勾选项 |

**写接口授权边界（v6.19，安全扫描 M-1，适用于 22.19 与 22.20 的七个写接口）**

七个写接口（22.19 的管理员 CRUD 与改密、22.20 的角色 CRUD）在 `requirePermission('admin:write')` 之上统一执行两级边界，判定实现为 `utils/permissions.js` 新增的 `permissionsBeyondActor` / `canManageRole` / `canManageAdmin`：

- **对象边界**：非超管不能操作超管（`id=1` / `role_id=1` / `is_super` 角色）与「有效权限（角色 ∪ 自身）超出自身范围」的管理员/角色 → 403，文案五条：「无权修改该管理员：目标账号权限超出你的管理范围」「无权修改该管理员密码：目标账号权限超出你的管理范围」「无权删除该管理员：目标账号权限超出你的管理范围」「无权修改该角色：超出自身权限范围」「无权删除该角色：超出自身权限范围」。
- **授予边界**：非超管提交的 `permissions`/`role_id` 必须 ⊆ 其自身权限 → 403「无权授予超出自身权限范围的权限: <列表>」/「无权分配超出自身权限范围的角色」。
- 超管口径不变（`isSuperAdmin`：`id=1` 或 `role_id=1` 或 `role==='super_admin'` 或权限含 `all`），超管不受两级边界约束；「同权管同权」的合法操作不受影响。
- **行为变更**：修复前任何持 `admin:write` 的管理员都能给自己或他人写 `permissions:['all']`、把 `role_id` 改成 1 一步成为超管，也能重置超管口令、改超管角色账号实现接管；修复后这些越界操作一律 403（不改库、不触发 H-5 吊销）。
- **遗留**：改 `permissions`/`role_id` 仍不吊销在用令牌，但 v6.20（M-2）起 `adminAuth` 每请求实时回读，改库后**下一个请求即生效、无需被改者重新登录**（M-1 当时的「快照需重登」口径已被 M-2 覆盖）；`ADMIN_EMERGENCY_LOGIN` 应急账号不走 `xn_admin` 表、权限恒 `['all']`，不受本边界约束（刻意保留）；无「平级多超管」运维入口。

---

### 22.21 兼容保留端点（deprecated，勿用于新调用）

> 2026-10-20 盘点：以下端点**保留兼容、不删除、不改行为**；仓内 `admin-frontend/` 已无调用方，仅仓外旧后台/旧脚本可能使用。新代码一律调用替代端点。删除条件：确认无仓外客户端后整体移除，并同步删除本表与代码注释（`routes/admin.js` 兼容块、`routes/adminManage.js`、`routes/pay.js`）。

| 兼容端点（deprecated） | 替代端点 | 备注 |
|---|---|---|
| `POST /api/admin-manage/login` | `POST /api/admin/login` | 两个后台登录入口共用失败锁定计数；响应封装不同，新调用用规范入口 |
| `GET /api/admin/statistics` | `GET /api/admin/dashboard` | 同一 handler 的旧路径别名 |
| `POST /api/admin/update-user-status` | `PUT /api/admin/users/:id/status` | body.userId 映射到 path id |
| `GET /api/admin/user-detail` | `GET /api/admin/users/:id` | query.userId 映射到 path id |
| `POST /api/admin/review-withdraw` | `POST /api/admin/withdraws/:id/approve` / `:id/reject` | 旧 body.status 分流 |
| `POST /api/admin/handle-report` | `POST /api/admin/reports/:id/handle` | body.reportId 映射到 path id |
| `PUT /api/admin/reports/:id` | `POST /api/admin/reports/:id/handle` | 旧更新语义，与 handle 共用 handler |
| `GET/DELETE /api/admin/recharges[/:id]` | `GET/DELETE /api/admin/recharge-records[/:id]` | 仅路径别名 |
| `POST /api/admin/companion-applications/:id/approve\|reject` | `PUT /api/admin/companion-applications/:id/approve\|reject` | 旧 POST → 新 PUT |
| `POST /api/pay/pay/create` | `POST /api/pay/create-order` | 与 createOrder 逻辑等价，仅成功文案不同 |

## 23. 项目管理模块 (`/api/project`)

> 内部项目管理（如部署项、服务项）的 CRUD 与生命周期操作。

> ⚠️ **本模块已于 2026-10-03 的业务调整中整体移除，下列接口不可调用**（`src/routes/` 下无 `project` 路由，`app.js` 未挂载 `/api/project`，前端页面与 `projectService.js` 同步删除）。表格仅作历史留存，口径见 20 章「已移除模块」。

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
| `/api/wallet/overview` | GET | 需要 | 钱包总览（v6.8 起 `totalAssets` = 真实余额 `xn_user.money`，并新增 `balance`、`giftMoney`；`grossIncome`/`totalWithdraw`/`todayIncome`/`todayExpense` 为统计口径，不再参与余额判定） |
| `/api/wallet/income-records` | GET | 需要 | 收入记录列表 |
| `/api/wallet/income-breakdown` | GET | 需要 | 收入分类明细 |
| `/api/wallet/withdraw-records` | GET | 需要 | 提现记录列表 |
| `/api/wallet/expense-records` | GET | 需要 | 支出记录列表 |
| `/api/wallet/expense-overview` | GET | 需要 | 支出分类概览 |
| `/api/wallet/withdraw` | POST | 需要 | 申请提现（2026-10-04 起服务端校验收款信息列长：`name≤50`、`account/bank/image≤255`，并拒绝 `data:` 开头的收款码——须先走 `/api/upload` 取图片链接；**v6.8 起申请即扣款**，见下） |

**`POST /api/wallet/withdraw` 资金流（v6.8，安全扫描 C-2）**

- 请求体：`{ "amount": 200, "type": 1, "account": "", "name": "", "bank": "", "image": "" }`；手续费由服务端 `calculateWithdrawFee` 计算，前端展示值不作为依据。
- **入参校验（v6.23.0，安全扫描 M-6）**: 边界层先校验 `amount` 为正有限数字（0.01~100000000）、`type` 为整数 ∈ 1/2/3，`account`≤255/`name`≤50/`image`≤255/`bank`≤255 字符，数组/对象/布尔冒充数字与负/超范围一律回 400；此层在 JWT 鉴权之后执行，未登录仍是 401。
- 校验顺序：金额有限数（非数字/`Infinity` → 422「提现金额必须为有限数字」）→ `>0` → `≥100`（`WITHDRAW_MIN`）→ 收款信息列长 → **才**开事务。
- 事务内 `UPDATE xn_user SET money = money - amount WHERE id = ? AND money >= amount`（`User.decrement` + 影响行数判定），
  未命中即回滚并返回 422「可提现余额不足」。并发下最多一笔成功，无需额外行锁。
- 落单 `xn_withdraw`：`channel='wallet'`、`is_check=0`、`status=0`、`money=amount=申请额`、`shouxufei`/`pay_money` 为服务端算出的手续费与到手额。
- 历史实现（已废弃）：只写提现单、余额靠「累计收入 − 已申请提现」派生，`money` 一分不动 → 同一笔余额可反复消费 + 提现；且派生口径不含支出与充值。
- 响应：`{ success, message, goldCoins, fee, netAmount, currencyUnit }`。

---

## 25. 文档版本历史

| 版本 | 日期 | 更新内容 | 状态 |
|------|------|----------|------|
| v6.35.0 | 2026-10-17 | 已读自动销毁服务端化 + 消息级举报：`mark-read` 返回 `destroyAt`、历史消息新增 `readAt`/`destroyAt` 且到期不再返回、socket `message:read` 带 `destroyAt`；`POST /api/report` 支持 `targetType=4` 并冻结该消息的撤回/销毁期限 | ✅ 已完成 |
| v6.34.0 | 2026-10-17 | 时间自动撤回服务端化：发送/历史消息/socket 负载新增 `expireAt`；到期消息在读接口按已撤回下发；撤回期限来自 `xn_user_pref.data.privacy.autoRecall`（上限 300 秒）；后台每 60 秒清理到期消息并回收媒体 | ✅ 已完成 |
| v6.33.0 | 2026-10-17 | 聊天撤回语义收口（接口契约不变）：3.4 撤回后清空 `content`/媒体地址并删除媒资；3.2 历史消息对 `is_revoked=1` 不再下发原文（`content` 空串、`mediaUrl` 为 `null`）；撤回拦截类型由 3/4 更正为 6/7；3.2 消息类型表按 `MESSAGE_TYPE_MAP` 订正 | ✅ 已完成 |
| v6.20.0 | 2026-10-05 | 安全扫描第十四项 M-2（管理员 JWT 硬编码 7 天且权限写在 token 里）的接口侧记录：**路径/请求体/成功载荷一字未改**。①管理端访问令牌新增独立时效配置 `ADMIN_JWT_EXPIRES_IN`（默认 **12h**，支持 `s/m/h/d`），两个登录入口的账号/角色/应急共 6 处签发统一使用，不再与用户端共用 `JWT_EXPIRES_IN`（7d）；②payload 新增 `adminScope`（`account`/`role`/`emergency`）区分 `id` 指向 `xn_admin`/`xn_admin_role`/应急账号（两表 id 独立自增可碰撞）；③`adminAuth` 每次请求实时回读数据库（`resolveLiveAdmin`）：管理员已删除 → 401「令牌已失效」，被禁用 → 403「账号已被禁用」，`permissions`/`role_id` 取库内当前值——改权限/换角色/禁用/删号**下一个请求立即生效**；④无 `adminScope` 的存量令牌一律 401 强制重登（与 H-4 同口径）；⑤回读失败沿用吊销 fail 取向（生产 fail-closed 503、非生产 fail-open 快照放行）。分工：改口令踢旧令牌仍只靠 H-5 吊销（回读不校验口令版本）；删号/禁用为吊销+回读双保险；改权限/角色不吊销令牌、改库即生效。22.1 补「令牌时效」并重写「会话终止」，22.19 五处标注。**行为变更**：升级后存量管理员令牌全部失效需重登一次；管理端 `common.js` 401/403 本就清态跳登录，**前端零改动**。**遗留**：payload 权限快照保留（仅非生产回退）；`admin_refresh` 无消费入口；`ADMIN_TOKEN` 不可吊销；与用户端共用密钥/role 声明放行属 M-3。改写 `tests/unit/middlewares/auth.test.js`（新增 8 例）与 `admin.test.js`/`adminManage.test.js` 签发断言，因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.18 | ✅ 最新 |
| v6.19.0 | 2026-10-05 | 安全扫描第十三项 M-1（后台 RBAC 自提权）的接口侧记录：七个 admin-manage 写接口（管理员 CRUD/改密 + 角色 CRUD）在 `admin:write` 之上加**两级授权边界**——**对象边界**（非超管不能操作超管与「有效权限超出自身」的管理员/角色，五条 403 文案）与**授予边界**（非超管提交的 `permissions`/`role_id` 必须 ⊆ 自身，两条 403 文案），完整口径见 22.19/22.20 末「写接口授权边界」小节；超管（id=1 / role_id=1 / 权限含 `all`）不受限。**顺带修复**：`POST /admins` 始终按有效角色（`role_id \|\| 2`）校验，缺省角色 2 不再是绕检旁路。路径/请求体/成功载荷不变；越界操作由「成功」变为 403（管理端透传 message，无需发版）。**遗留**：改 `permissions`/`role_id` 不吊销在用令牌（快照口径）；应急账号恒 `['all']` 不受限。新增 `tests/unit/utils/permissions.test.js`（11 例）与 `adminManage.test.js` M-1 describe（12 例）因本机无 node/npm **未执行** | ✅ 已完成（M-2 见 v6.20.0） |
| v6.18.0 | 2026-10-05 | 安全扫描第十二项 H-9（.env 卫生与弱口令兜底）：**无接口变更**，登记四条兜底行为变化——`DB_PASSWORD` 未设置时不再回落 `'123456'`（本地连库直接失败）、`scripts/backup.js` Redis 备份不再回落 `'redis123'`、`TURN_SECRET` 缺失/弱值时启动告警（仅 `TURN_URL` 已配置即中继真正启用时）、`scripts/deploy-selfcheck.js` 补 `MONGO_URI` 内嵌口令扫描；四份 `.env*.example` 补键位删死键（只写键名）。详见《后端开发文档》v6.16 | ✅ 已完成（M-1 见 v6.19.0） |
| v6.17.0 | 2026-10-05 | 安全扫描第十一项 H-8（限流按可伪造 IP + 开发环境整体豁免）的接口侧记录：**所有路径、请求体、成功响应、429 文案一字未改**，改的是限流何时生效与按谁的 IP 计。①新增 1.7 章「限流与真实客户端 IP」，六个限流器的窗口/默认阈值/环境变量/超限响应列成一张表，并写明 `app.set('trust proxy', 1)` 写死一跳信任下 `X-Forwarded-For` 可随机化（origin 可达即可每次换一个 `req.ip`，按 IP 计的限流形同虚设，访问日志与 `xn_admin.last_login_ip` 同样可被涂抹）；②`TRUST_PROXY` 成为信任层级唯一入口（`src/config/trustProxy.js`，默认 `loopback`），危险或含糊取值（`true`/`*`/`all`、`0.0.0.0/0`、跳数>10、跳数与网段混写、八位组>255、前缀越界、主机位非零网段）在配置加载期抛错拒绝启动；③**行为变更：`NODE_ENV=development` 不再豁免任何限流**，本地联调同样撞 429，放开只用 `RATE_LIMIT_MAX_REQUESTS`/`LOGIN_RATE_LIMIT_MAX`/`ADMIN_LOGIN_RATE_LIMIT_MAX`/`SMS_RATE_LIMIT_MAX` 或本地 `RATE_LIMIT_DISABLED=true`（`NODE_ENV=production` 时设它后端拒绝启动）；④1.3 状态码表 429 行、1.4 中间件表补全六个限流器与响应头口径（`standardHeaders:true` = draft-6 → `RateLimit-Policy/Limit/Remaining/Reset`，429 另带 `Retry-After`；旧的 `X-RateLimit-*` 已关），22.1 第 1 道补注统一无环境豁免；⑤跨机部署（docker-compose/K8s ingress）必须显式声明反代网段，本仓库 `docker-compose.yml` 已注入 `TRUST_PROXY=loopback,172.16.0.0/12`，启动日志打印 `🔒 trust proxy = <取值>（来源：…）`。**遗留**：计数仍在进程内存（多实例各一份，需共享 store）；`LOGIN_RATE_LIMIT_MAX`/`ADMIN_LOGIN_RATE_LIMIT_MAX` 未收敛进 `config`；`tests/e2e/*` 三脚本需以 `RATE_LIMIT_DISABLED=true` 启动后端。新增 `tests/unit/config/trustProxy.test.js`（18 例）、重写 `tests/unit/middlewares/rateLimit.test.js`（6 例，原文件自 H-3 起即与实现不符）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.15、《部署文档》v6.10 | ✅ 已完成（H-8，.env 见 v6.18.0） |
| v6.16.0 | 2026-10-05 | 安全扫描第十项 H-7（预约/订单状态机竞态 → 重复退款、重复分账）的接口侧记录：**路径、请求体、成功载荷一字未改，改的是并发语义**。①`/api/reserve/cancel` 与 `/api/reserve/complete` 原为「`findByPk` 读状态 → 无条件 `update` → `User.increment` 打款」，两个并发请求各自通过校验 → 同一笔预约**退两次款 / 分两次账**；现改为事务内条件更新占位（取消 `WHERE id AND user_id AND status IN (0,1)`；完成 `WHERE id AND status=1 AND (user_id=? OR target_user_id=?)`），影响行数=1 的那一次才动钱，落败方回滚并返回既有 422 文案（`controllers/reserve.js` 的业务错误统一走 `unprocessableEntity`，缺参数才是 400）；②`confirm`（`0→1`）/`reject`（`0→2`）同样改条件更新，`reject` 的「改单 + 释放时间槽」两处写入并入同一事务（原先完全无事务），槽位释放只命中 `status=1` 的占用槽，不会覆盖别人刚占用的时段；③分成比例改在事务内读取——`getCommissionRate(key, fallback, transaction)` 新增可选第三参数，`reserve_commission_rate`/`order_commission_rate` 与写金额同快照；④`/api/reserve/slots/toggle` 新增两条拒绝：`status=1`（已成交）时段不可切换（原实现会把 1 翻回 0，凭空释放已占用时段 → 同一时段被重复预约），并发下状态已变则「时间槽状态已变更，请刷新后重试」；⑤游戏订单侧 `/api/games/start`（`1→2`）、`/complete`（`2→3`，含 `gift_money`/`gift_money_zong` 分账与 `income_total`/`order_num` 累加）、`/appeal`（`1\|2\|3→5`）改条件更新，`/evaluate` 在事务内 `FOR UPDATE` 重读订单行与陪玩师资料行（重复评价返回「该订单已评价」，不再二次污染滚动平均分）；⑥新增 8.11 小节与 6.3 并发说明，把「条件更新 + 影响行数」判据与 H-2/C-2/H-6 归为同一套写法。**遗留**：`toggle` 仍忽略前端传的 `enabled`（服务端自翻转），且 `reserveService.toggleSlot` 全仓库无调用方；`appeal` 不做资金冲退，裁决靠后台人工；只保证「同一次迁移只生效一次」，尚未引入请求级幂等键。改写 2 个测试文件（`tests/unit/services/reserveService.test.js`、`tests/unit/services/gamesService.test.js`，新增 8 条并发用例、按新实现改写 9 条既有用例）因本机无 node/npm **未执行**，仅静态复核。详见《后端开发文档》v6.14 | ✅ 已完成（H-7，限流 IP 口径见 v6.17） |
| v6.15.0 | 2026-10-05 | 安全扫描第九项 H-6（付费装扮所有权与扣款金额由客户端决定）的接口侧记录：①新增 2.18 章「装扮商城（目录 / 购买 / 切换）」——`GET /api/user/skins`（服务端目录 + 余额 + `owned/using` + `unlocked/needLevel`）、`POST /api/user/skins/purchase`、`POST /api/user/skins/use`，客户端只提交 `skinId`，四类业务拒绝码 `SKIN_NOT_FOUND`/`SKIN_VIP_REQUIRED`/`INSUFFICIENT_BALANCE`/`SKIN_NOT_OWNED` 一律 422 且 `errors.skin` 带原因码；②2.16 章改名为「用户偏好设置」并收口——请求体 `skinShop` 被剥离、`GET` 不再回传 `skinShop`、`spend` 废弃（只容忍显式 `0`，其余 422），`POST` 响应不再带 `balance`，门槛表删掉「`data.skinShop` 且 `spend > 0` → `skin_shop` Lv.45」这一行（`spend=0` 可同时绕开扣费与门槛，即本缺陷根因），门槛判定改由购买接口无条件执行。**遗留**：改造前伪造进 `xn_user_pref.data.skinShop` 的目录内条目仍视为已拥有（本轮不动存量数据）。详见《后端开发文档》v6.13 | ✅ 已完成（H-6，并发竞态见 v6.16） |
| v6.14.0 | 2026-10-05 | 安全扫描第八项 H-5（无服务端登出、令牌黑名单只有读取侧）：①新增 1.6 章「令牌吊销与登出」——两类状态（`auth:blacklist:<sha256(令牌)>` 单令牌拉黑 + `auth:revoke-user\|admin:<id>` 全端下线水位线，均只存 Redis）、触发接口清单、401/403/503 分工与 `AUTH_BLACKLIST_FAIL_MODE`；②新增 2.17 `POST /api/user/logout`（拉黑本次 access；body `refreshToken` 需 `type=refresh` 且归属本人；body `logoutAllDevices` 走水位线 → **C 端登出即全端下线**）；③新增 `POST /api/admin/logout`（22.1）与 `POST /api/admin-manage/logout`（22.19），吊销「本次请求实际命中的那一枚令牌」，`ADMIN_TOKEN` 应急固定令牌走 `revocable:false`；④2.10 重置密码改为写库前全端下线并回 `data.devicesRevoked`；⑤2.13 刷新链路加吊销闸门（已登出 → 401，生产无法确认 → 503）；⑥22.1/22.19 补「改管理员口令 / 删除管理员 / 禁用管理员」改库前先作废会话（`data.sessionsRevoked`），22.2 封号尽力而为下线；⑦写入侧与读取侧统一 fail 取向：生产 fail-closed 不改库，非生产 fail-open 并如实回报。遗留：`ADMIN_TOKEN` 不可吊销；改权限/角色不吊销在用令牌；`admin_refresh` 仍无消费入口；Redis 清空即黑名单与水位线全丢。用例因本机无 node/npm **未执行** | ⚠️ 代码与文档已就位，测试未执行 |
| v6.13.0 | 2026-10-05 | 安全扫描第七项 H-4（令牌无 `type` 声明，access/refresh/管理员令牌可互换）的记录：①`config/jwt.js` 新增 `TOKEN_TYPES`（`access`/`refresh`/`admin`/`admin_refresh`）并导出，`generateToken(payload, type)`/`signToken(payload, expiresIn, type)` 强制带合法 type，未知或缺省直接抛错；②`verifyToken(token, allowedTypes)` 增加用途白名单参数（省略时只验签，保持既有调用方语义），四个鉴权入口全部显式传名单——`middlewares/auth.js` 的 `authMiddleware`/`optionalAuth` 用 `[access]`、`adminAuth` 用 `[admin]`、`socket/index.js` 握手用 `[access]`、`refreshAccessToken` 用 `[refresh]`，`authService.refreshToken` 复校新 access 令牌也用 `[access]`；③`controllers/admin.js`（3 处）与 `controllers/adminManage.js`（5 处）的 `signToken` 全部改传 `TOKEN_TYPES.ADMIN`/`ADMIN_REFRESH`，此前管理端令牌与用户令牌结构完全一致、可跨用途使用；④刷新重签只结转 `userId`，删掉旧代码里 `const { userId, exp, iat, ...payload } = decoded` 的未使用死变量（后续改动若直接拿 `payload` 签名就能把伪造的 `role`/`permissions` 洗进 access 令牌）；⑤新增 1.5 小节令牌用途表，2.13/17.1/22 章/22.19 补用途口径；⑥顺带清理：`controllers/user.js` 移除从未使用的 `generateToken` 引入，`authService.js` 同理，`tests/unit/controllers/user.test.js` 移除失效的 jwt mock；e2e 脚本（`api-matrix.js`/`real-data-smoke.js`/`real-data-write.js`）本地签发的测试令牌补 `type: 'access'`。**行为变更**：无 `type` 的历史令牌一律无效，上线后所有会话需重新登录（前端 401 分支已清登录态并跳转登录页，管理端同理）。新增 16 个 jest 用例（`config/jwt` +8、`middlewares/auth` +6、`services/authSmsCode` +2）并强化 6 个既有用例（`controllers/admin` 3 例、`controllers/adminManage` 3 例断言签发 type）；因本机无 node/npm **未执行**。**遗留**：`admin_refresh` 令牌无服务端消费入口（前端只存 `localStorage`）；`JWT_EXPIRES_IN` 默认 `7d`，access 令牌时效偏长；无服务端登出/吊销（H-5，已于 v6.14 修复） | ✅ 已完成 |
| v6.12.0 | 2026-10-05 | 安全扫描第六项 H-3（后台登录无限流，可在线爆破管理员口令）的接口侧记录：①22.1 `POST /api/admin/login` 与 22.19 `POST /api/admin-manage/login` 挂上 `adminLoginLimiter`（单 IP 15 分钟 5 次，`ADMIN_LOGIN_RATE_LIMIT_MAX` 可调，**不豁免开发环境**），此前两个入口只吃全局 `apiLimiter`（代码默认 100 次/分钟，`.env` 配的 1000 次/15 分钟）；②新增账号维度失败锁定 `services/adminLoginGuard.js`——Redis 键 `admin:login:fail:<归一化账号>`（`trim().toLowerCase()`，大小写变体绕不开计数），15 分钟窗口内失败 `ADMIN_LOGIN_MAX_FAILS`（默认 5）次锁 15 分钟，返回 429 + `data.retryAfterSec`，三个成功分支（数据库账号 / 角色账号 / 应急口令）都清计数；③**不存在的用户名同样计数**，否则「会不会被锁」本身就成了账号存在性 oracle；401 文案统一不区分账号是否存在；④缺参数的 400 **不计失败**，防止任何人用空请求把管理员账号锁死（DoS）；⑤Redis 缺失、命令报错或读写超过 2 秒 → `verifiable:false` → 503 **保守拒绝**，安全控制不做 fail-open，与 `smsService` 的验证码校验同一口径；⑥22.1 响应载荷校正为代码真实的 `data.user`（旧文档写的 `{ token, adminId, username }` 从不返回），并补齐三级口令口径（`xn_admin` 且 `status=1` → `xn_admin_role` 自带口令 → `ADMIN_EMERGENCY_LOGIN=true` 的环境变量账号）与 400/401/403/429/503/500 错误分流，22.19 标注两个入口共用同一计数键；⑦管理端 `admin-frontend/src/common/common.js` 的 `request()` 此前把非 2xx 一律显示成「请求失败 (429)」，锁定提示和恢复时间到不了管理员眼前，本轮改为解析响应体并透传 `message`（非 JSON 时保留默认文案）。新增 `response.tooManyRequests`。**遗留**：应急口令仍是非常量时间的 `!==` 比对（M 项另记）；登录成功/失败无审计流水；本轮 25 个 jest 用例（`controllers/admin` +6、`controllers/adminManage` +5、`services/adminLoginGuard` 新增 14）因本机无 node/npm **未执行** | ✅ 已完成 |
| v6.11.0 | 2026-10-05 | 安全扫描第五项 H-2（支付回调竞态 + 订单归属）的接口侧记录：①5.8 `/api/pay/wx-callback` 由「不需要认证」改为**需要登录**，服务层再校验订单归属（`order.user_id ≠ req.userId` → 403），他人不能替这单确认支付；②新增 5.9 小节，写明入账收口 `payService.settleRechargeOrder(order, verification)`——`UPDATE xn_order_chong SET status=1,pay_time WHERE id=? AND status=0` + 影响行数判定 + 同一事务内 `User.increment('money', { by: order.coins })`，替换原「`findOne(status:0)` → `update` → `increment`」的双加竞态（微信对同一订单会并发、多次重发通知）；③金额口径：入账金币只取订单 `coins`（下单时服务端定价），平台回传 `total_fee` 仅用于与 `round(amount×100)` 比对，不一致 422 拒绝；④5.4 `/wx-notify` 补齐 `result_code`/`appid`/`mch_id`/`fee_type=CNY`/`total_fee` 五项校验（原实现只看 `return_code` 与签名，未付款通知同样会走到入账分支），已入账订单的重复通知改回 `SUCCESS`（原回 FAIL → 微信按退避策略无限重发），入账失败不再先改订单状态（原顺序会造出「已支付却从未加币」的永久丢单）；⑤5.5 `wx-query`、5.6 `wx-close` 走 `requireOwnedOrder`，5.7 `order-status` 查询条件带 `user_id`，他人订单统一 404「订单不存在」；⑥`/wx-notify` 请求体上限 64KB 并兜住 `'end'` 回调异常（原实现无上限累积 chunk，异步回调抛错既不回包也不记录），`return_msg` 回显前拆掉 `]]&gt;` 防提前闭合 CDATA；⑦`parseXml` 剥离 `<![CDATA[...]]>` 包裹——微信真实报文此前一条都匹配不上，`return_code` 恒为 `undefined`，所有真实回调都在第一步被判失败；⑧业务错误按 `PAY_ERRORS` code 分流 403/404/422/200（幂等 `data.duplicated=true`），无 code 的意外故障保持 500，不伪装成业务拒绝；⑨纠正 `部署文档.md` 的支付/短信环境变量键名（`WX_APP_ID` 等代码从不读取，真实名为 `WECHAT_APPID`/`WECHAT_MCHID`/`WECHAT_API_KEY`/`WECHAT_NOTIFY_URL`、`SMS_TEMPLATE_ID`/`SMS_NOTIFY_TEMPLATE_ID`），商户异步通知地址由 `/wx-callback` 改回 `/wx-notify`，`.env.example` 与 `.env.production.example` 补 `WECHAT_NOTIFY_URL` 键位；⑩20 章补记群聊与 `/api/project` 移除，23 章表格标注为历史留存。**遗留**：`xn_order_chong` 无支付流水号列（`transaction_id` 只进日志，对账靠日志）；支付宝无服务端下单/回调实现，除本地联调开关外该渠道无法入账；V2 MD5 签名待迁移 V3；本轮 31 个 jest 用例（`payServiceSettle` +12、`wechatPayNotify` +11、`controllers/pay` +8 改写 4）因本机无 node/npm **未执行** | ✅ 已完成 |
| v6.10.0 | 2026-10-05 | 安全扫描第四项 C-4（TRTC 通话房间不设防）的接口侧记录：①11.1 `GET /api/trtc/auth` 不再无条件发票据——不传 `roomId` 只回 `configured/appId` + `userSig:null` + `requiresRoomId:true`（供 `isTRTCAvailable()` 探测），传 `roomId` 才查 `xn_call_record` 确认请求者是这通电话的主叫/被叫、且 `status ∈ {0 呼叫中, 1 已接通}` 后签发 UserSig；②新增 11.4 小节，写明成员校验口径、`ORDER BY status ASC, create_time DESC` 的取单理由与 400/403/404/422/500 的错误分流（意外故障不伪装成业务拒绝）；③11.2/11.3 五个房间与计费口子（`room/enter`、`room/leave`、`room/:roomId`、`billing/start`）全部接入 `resolveRoomCall`/`requireEnterableRoom`，`leave` 只校验身份不校验状态（挂断后仍要能退房）；④`getRoomInfo(userId, roomId)` 改签名，返回真实 `status/statusCode/callerId/calleeId/createTime`，原实现不收 userId 且把 `status` 写死为 `'active'`；⑤11.1 `start` 的 `trtc_room_id` 改用 `crypto.randomInt(1,1000000)` 并对 `status∈{0,1}` 的通话查重、最多重试 5 次，冲突用尽则 422「通话房间号分配失败」（原 `Math.floor(Math.random()*1000000)+1` 不查重，撞号即两通电话串音串画）；⑥前端配套：`trtcService.getAuth(roomId)` 透传房间号、`trtcRoomService.join()` 先验房间号再申领票据、`isTRTCAvailable()` 探测不再要求响应带 `userSig`。**遗留**：进房票据仍是房间无关的普通 UserSig（`generateRoomSig` 是官方**字符串房间号** userbuf 布局，前端进的是数字房间，离线无法验证数字布局，贸然切换会打断所有真实通话）；`room/create` 与 `billing/*` 仍是不落库的占位实现且前端无调用方；socket `call_*`/`webrtc_*` 转发仍信任客户端上报的 `toId`（另记 H 项）；本轮新增/改写的 jest 用例（`services/trtc` +9 例、`controllers/trtc` 新增 4 例改写 2 例、`services/callBillingService` +4 例）因本机无 node/npm **未执行** | ✅ 已完成 |
| v6.9.0 | 2026-10-05 | 安全扫描第三项 C-3（卡密兑现）的接口侧记录：①5.8 `/api/pay/validate-card` 认证要求由「不需要」改为**需要**，`/use-card`、`/redeem-key` 补挂 `cardLimiter`（单 IP 10 次/分钟）；②`/validate-card` 与 `/use-card` 的 422 语义重写——请求体新增必填 `cardPwd`，先查卡再**恒定时间比对 `card_password`**（sha256 摘要 + `timingSafeEqual`），卡号不存在与密码错误合并为「卡号或密码错误」，旧文案「密卡不存在」是免登录枚举 oracle；③新增「卡密兑现口径」小节，写明校验顺序、`status=0` 条件原子核销、入账金额取 `coin_amount` 回落面值；④22.17 `POST /api/admin/cards` 记录生成方式变更：卡号 `DK`+14 位、密码 12 位（32 字符集去掉 I/O）、密钥 25 位数字，逐字符 `crypto.randomInt`（原三处均 `Math.random`，卡号还以 `Date.now()` 的 base36 开头，已知发卡时间即可预测），并以一条 `Op.or` 查询同时查重卡号与密钥；⑤前端 `payService.redeemCard` 随请求发送 `cardPwd`（原先 UI 收集密码却从不提交）。**遗留**：`card_password` 明文落库未改（管理端列表要展示给发卡方），只做了比较侧的时序防护；历史已发卡密的熵偏低且卡号可预测，建议作废未售存量重新发放；本轮新增/改写的 jest 用例（`payServiceCard` +8 例、`controllers/pay` 改 2 例、`controllers/admin` +1 例）因本机无 node/npm **未执行** | ✅ 已完成 |
| v6.8.0 | 2026-10-05 | 安全扫描第二项 C-2（提现资损）的接口侧记录：①24 章 `POST /api/wallet/withdraw` 改为事务内**条件扣减真实余额 `xn_user.money`**（`User.decrement` + 影响行数判定，未命中回滚报「可提现余额不足」），历史实现只写提现单、余额靠「累计收入−已申请提现」派生，`money` 分文未动，同一笔钱可反复消费 + 提现；②`GET /api/wallet/overview` 的 `totalAssets` 改为真实余额并新增 `balance`/`giftMoney`，`grossIncome`/`totalWithdraw` 降级为统计口径（旧派生值既不含支出也不含充值，页面显示的「总资产」可以把已花掉的钱再提走）；③4.4 礼物提现补记 `gift_money` + `money` **双笔条件扣减**与新增的 `assertFiniteNumber`（`NaN`/`Infinity` 之前会穿透成 `gift_money - NaN`）；④22.4 审核 `approve`/`reject` 改为条件更新 `WHERE is_check=0` + 影响行数判定（原「先查再改」两语句间存在并发窗口，双管理员/双击可双批双退），并列出三个渠道（wallet/gift/admin）的扣减与退回对照表，`channel` 空值按 `gift` 处理（与列 `DEFAULT 'gift'` 一致）。**遗留**：修复上线前已存在的 pending 提现单是按旧口径建的（未扣款），驳回时若按新逻辑退回会多退一笔——需人工核对存量，本轮未做数据修补；新增/改写的 jest 用例因本机无 node/npm **未执行** | ✅ 已完成 |
| v6.7.0 | 2026-10-04 | 安全扫描首个修复项 C-1/H-1 的接口侧记录：2.7 `POST /api/user/login-mobile` 与 2.9 `POST /api/user/register` 改为**服务端强制校验短信验证码**（根因：`authService.loginWithMobile(mobile, code, ...)` 的 `code` 形参从未被使用，全局只有 `resetPassword` 调用过 `verifyCode`，等于凭任意手机号即可登录任意账号并自动注册）；2.6 `send-sms` 的 `type` 参数开始生效，登录/注册/重置三类改为各用 `sms:code:<type>:<mobile>` 独立键并各计 60 秒冷却，`verifyCode` 增加连续 5 次失败即作废、空码拒绝、SHA-256 摘要后 `timingSafeEqual` 比较；2.10 明确 `reset` 场景；顺带校正 2.7 响应载荷为 `accessToken/refreshToken/expiresIn/refreshExpiresIn`（旧文档的 `token` 字段代码从不返回）。**遗留**：生产发码仍需在 `.env` 填 `SMS_TEMPLATE_ID`/`SMS_NOTIFY_TEMPLATE_ID`（根 `.env.example` 本次已补键位，含此前缺失的 `SMS_SDK_APP_ID`）；新增的 11 个 jest 用例因本机无 node/npm **未执行** | ✅ 已完成 |
| v6.6.0 | 2026-10-04 | 开屏弹窗接通：16.7 `GET /api/splash/active` 补全过滤规则（`status=1` + `start_time/end_time` 0 值语义 + `sort DESC` 取前 5）、`?frequency=` 参数语义、响应载荷与「去重在客户端」的分工，C 端由 `App.vue` + `SplashPopup.vue` + `utils/splashScreen.js` 接通（`localStorage` 按 1 每次/2 每天/3 每周/4 仅一次 去重，一次启动只弹一条）**遗留**：管理员若需「在线即时推送」还需 socket 全服 fan-out（现只有 `user:<id>` 定向事件）；公告接口 `/api/notice/list` 仍是硬编码占位、未落库 | ✅ 已完成 |
| v6.5.0 | 2026-10-04 | 等级经验链路与权益门槛（《前端功能差异清单》§11.5 #8）：①新增 2.14 `GET /api/user/level`（等级/进度/VIP 倍率/经验来源/7 项权益，曲线 `lv*1000+500`、`exp` 为等级内进度且升级结转）、2.15 `POST /api/user/level/check-in`（条件更新做原子占位，按自然日去重，重复签到 422）、2.16 `GET/POST /api/user/pref`（补文档，含 4 项权益门槛表与 422 示例）；②7 项服务端门槛：2.2 非空签名 Lv.5、2.16 隐身 Lv.10/身份标识 Lv.20/优先匹配 Lv.30/装扮购买 Lv.45、7.6 带图动态 Lv.15、13 相册容量 Lv.25（20→50 张），统一由 `utils/levelGate.js` 转 422 + `errors.level`；门槛只在请求真正「开启/购买」时校验，关闭开关与切换已有装扮不受限；③经验来源接线：6.3 完成订单给接单方 +50（分账事务提交后）、7.6 发动态 +20、签到 +10、实名 +100，均 `try/catch + logger`，记账失败不影响主业务；④18.1 补 `exp/last_check_in_time/level_backfill_time` 三列（幂等迁移 `20261004000001`，`runMigrations` 第 9 步）与按历史行为回填的口径说明。**遗留**：实名 +100 目前仅历史回填生效，因后台尚无「实名审核通过」接口。**测试**：`tests/unit` 63 套件 / 1125 例全绿（新增 `utils/level.test.js`、`services/levelService.test.js`） | ✅ 已完成 |
| v6.4.0 | 2026-09-30 | 用户信息响应精简与房间创建修正：①2.1 删除代码未返回的 7 个字段（vipExpireTime/totalGiftBalance/isDaRen/isManager/userStatus/createTime/lastLoginTime），保留 14 个实际字段；②3.6 房间创建请求体修正为 { title, subtitle, background, roomType } | ✅ 已完成 |
| v6.3.0 | 2026-09-30 | 聊天接口字段对齐代码实现：①3.1 聊天列表响应字段修正（roomId→id, targetUserId→fromId/toId, lastMessage→content, lastMessageTime→sendTime）；②3.2 聊天消息响应字段修正（messageId→id, fromUserId→fromId, toUserId→toId, status→isSelf/isRevoked, createTime→sendTime）；③2.1 补全 isFollow 字段；④2.13 refresh-token 认证要求修正为无需认证 | ✅ 已完成 |
| v6.2.0 | 2026-09-30 | 用户字段与映射对齐修正：①2.1 用户信息响应字段修正（gender→sex, region→city, 删除 followCount, 补全 giftBalance/isDaRen/isManager/userStatus/description）；②2.2 请求体 signature→description；③2.3 关注请求体 userId→targetUserId+action；④18.1 用户字段映射表补全 8 个遗漏字段；⑤sex 映射说明修正为直接传数字 | ✅ 已完成 |
| v6.1.0 | 2026-09-30 | 与《后端开发文档》《后端功能拆解开发指导》对齐修正：①17.1 连接地址由错误的 `/chat` 命名空间修正为默认命名空间 `/`；②17.2 客户端事件补全至 19 个（新增 room_message/join_room/leave_room/typing/revoke_message/p2p_* 等），17.3 服务端事件补全至 21 个并对齐实际载荷；③19.3 数据库配置修正：聊天消息实际存 MySQL（xn_chat_log），MongoDB 模型为预留未使用；④补充章节跳号（10/19）说明 | ✅ 已完成 |
| v6.0.0 | 2026-09-30 | API 端点全量补全：新增管理后台模块（/api/admin + /api/admin-manage，100+ 端点）、项目管理模块（/api/project，9 端点）、钱包模块（/api/wallet，7 端点）；扩充其他模块 16.6-16.12（banner/splash/config/download/search/notice/feedback）；增补 chat 房间管理、circle 分享/转发、games 详情/搜索/评价/统计、user check-follow/refresh-token、pay redeem-key、report detail、reserve detail 共 19 端点；修正 tag/virtualUser 管理员权限标注、report 可选认证标注 | ✅ 已完成 |
| v5.9.0 | 2026-08-02 | 存储与带宽优化：新增前端直传 COS 流程（/api/upload/token、/api/upload/register）、统一媒资表 xn_media_asset 与级联删除；相册/聊天/动态接入直传；COS 访问签名 URL 防盗刷；动态删除接口；P2P 热内容取回流骨架（/api/p2p/peer-online 与 socket 信令） | ✅ 已完成 |
| v5.8.0 | 2026-07-15 | 新增WebRTC双通道信令事件、TRTC房间管理和计费接口、支付模块扩展接口；移除不存在的接口（unfollow、album/detail、album/unlock、upload/file、upload/token）；修正chat/mark-read路径；更新call_invite数据结构 | ✅ 已完成 |
| v5.7.2 | 2026-05-23 | 添加测试规范、完成一致性测试验证 | ✅ 已完成 |
| v5.7.1 | 2026-05-23 | 统一字段命名、移除活动/团队模块 | ✅ 已完成 |
| v5.7.0 | 2026-05-20 | 初始版本 | ✅ 已完成 |