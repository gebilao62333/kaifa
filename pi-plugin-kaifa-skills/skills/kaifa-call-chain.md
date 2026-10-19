---
name: kaifa-call-chain
description: "kaifa 通话链路：TRTC/P2P/coturn 通道策略、通话单状态机与计费、清理器、探针与只能真机验证的边界。"
whenToUse: "改动落在 trtc/p2p/通话计费/清理器/通话前端页面或 TURN 部署配置时。"
tags: ["自习"]
---

# kaifa 通话链路（TRTC / P2P / TURN / 计费）

工作区根：`C:\Users\admin\Desktop\kaifa`。这是全仓耦合度最高的模块：**状态机 + 计费 + 清理器 + 通道策略 + 部署网络**，改一处容易漏三处。

## When to Use

- 改动 `routes/trtc.js`、`routes/p2p.js`、`controllers/trtc.js`、`controllers/p2pController.js`、`services/{trtcService,callBillingService,callRecordCleanup,callConfigService}.js`、`utils/p2pRelay.js`、`socket/index.js` 通话事件、`frontend/src/services/{trtcService,trtcRoomService,callService,webrtcCallService}.js`、`views/{AudioCall,VideoCall}.vue`。
- 调整 TURN / coturn 部署（`docker-compose.yml` 的 `turn` profile、`TURN_*` 环境变量）。

## Procedure

### 1. 通道策略（先看这里，别直接改 TRTC）

- 通道由**后端下发**：`GET /api/config/call`（`routes/config.js:33` → `services/callConfigService.js:19-55`），默认 `webrtc`；TRTC 是**手动开关**，不可用时回退 WebRTC（前端 `services/callService.js:41-80`）。
- TURN 临时凭据由后端签发（`callConfigService`），前端**不再**构建期写死。TURN 密钥必须与根 `.env` 的 coturn 启动值**逐字节一致**。
- 依据文档：根目录《通话通道改造说明.md》（§一 改造前问题 / §二 改造后行为 / §三 9 项改动清单 / §四 TURN 部署 6 步 / §五 验证结果 / §六 运维速查 / §七 自动化回归脚本 / §八 后续建议）。

### 2. 端点到服务

- `/api/trtc`（`routes/trtc.js:6-19`，**13 个端点全部 `authMiddleware`**）：`GET /auth`、`POST /start|cancel|reject|accept|end`、`GET /history`、`POST /room/create|room/enter|room/leave`、`GET /room/:roomId`、`POST /billing/start|billing/end`。
- `/api/p2p`（`routes/p2p.js:6`）：仅 `GET /peer-online`（经 `utils/socialPrivacy` 判定社交关系，无关系 → 403，见 M-11）。
- `controllers/trtc.js` 依赖 `trtcService`（签名/房间/成员校验）+ `callBillingService`（通话单生命周期与计费）。

### 3. 房间与票据（`services/trtcService.js`）

- 官方 TLSSigAPIv2 算法（HMAC-SHA256 → deflate → 腾讯 Base64URL，`:35-89`）；`generateUserSig`(:140) 默认 86400s、`generateRoomSig`/PrivateMapKey(:164) 默认 3600s（`ALL_PRIVILEGES=255`）；`verifyUserSig`(:177)。
- **没有房间表**：成员真相来自 `xn_call_record`（`:215-224`）。`resolveRoomCall`(:230-253) 非成员 → 「无权进入该房间」、无记录 → 「房间不存在或已过期」、非法房间号 → 「房间号格式不正确」；`requireEnterableRoom`(:255-261) **仅 status 0/1 可进**。
- ⚠️ `createRoom`(:263-276) 返回**内存对象**（不落库）；`startBilling`(:331) / `endBilling`(:345) 是**桩实现**（随机值，不写库）。**真实计费只在 `callBillingService.endCall` 内完成**——别照着桩实现推断计费行为。

### 4. 通话单状态机与计费（`services/callBillingService.js`）

状态枚举（`trtcService.js:306-313`，`ENTERABLE_CALL_STATUS=[0,1]`）：

| status | 含义 | 迁移触发 |
|---|---|---|
| 0 | calling | `startCall` 插入（`callBillingService.js:42-52`，`call_no` 来自 `utils/helper.js:17`；房间号 `crypto.randomInt(1,1000000)` 对 status∈{0,1} 查重，5 次失败抛错 `:14-29`） |
| 1 | active | `accept`（`:162-165` 写 `connect_time`） |
| 2 | rejected | `reject`，`end_reason='callee_reject'`（`:100-104`） |
| 3 | cancelled | 主叫取消，`'caller_cancel'`（`:76-80`） |
| 4 | ended | `end`（status=1 时），算 `duration`，`'normal'`（`:133-138`） |
| 5 | unanswered | 呼叫中挂断 `'unanswered_hangup'`（`:121-124`，不计费）／清理器 `'unanswered_timeout'` |

计费口径（`:140-181`）：**仅 `is_companion_call === 1` 且 duration > 0 才计费**；免费 180s，超出后按 60s 向上取整；单价 1 元/分钟。结算在事务内（`:189-223`）：原子条件更新 `money >= totalFee`（affected=0 → 抛「余额不足，通话已结束」并 rollback）；主叫扣 `money`，陪玩加 `gift_money = totalFee * 0.7`（`:182,200-204`）；`xn_call_billing` 写 `status=1`(已结算)+`settle_time`（`:207-217`）。

⚠️ 已知时序风险（改动前必读）：`endCall` 先提交 `status=4`（`:133-138`）再执行计费，余额不足时异常冒泡成接口 422，但**通话单已结束**——若要改这一段，先确认这个「已结束但未结算」的中间态是否可接受。

- 清理器 `services/callRecordCleanup.js`：`create_time < now-120s` 且 `status=0` → `status=5` / `end_reason='unanswered_timeout'`（`:26-45`）；`TICK_INTERVAL=60s`（`:16,47-55`）；注册在 `server.js:486-492`（listen 回调内），`SIGTERM` 时 `stopCallRecordCleanup`（`server.js:530-531`）。
- 表：`xn_call_record`（`call_no` 唯一、`status+create_time`、`trtc_room_id` 索引）、`xn_call_billing`（`call_id` 唯一，status 0 未结算 / 1 已结算）；间接写 `xn_user.money`/`gift_money`。

### 5. Socket.IO 事件（`socket/index.js`，前后端命名必须一致）

通话：`call_invite`(:194)、`call_cancel`(:215)、`call_reject`(:227)、`call_accept`(:239)、`call_end`(:252)、`webrtc_offer`(:266)、`webrtc_answer`(:279)、`webrtc_ice_candidate`(:292)。
P2P：`p2p_fetch_request`(:359)、`p2p_fetch_response`(:378)、`p2p_offer`(:400)、`p2p_answer`(:420)、`p2p_ice_candidate`(:437)（均经 `utils/p2pRelay` 白名单校验后转发）。
其他相关：`private_message`(:138)、`typing`(:304)、`message:read`(:322)、`revoke_message`(:334 → `message_revoked`)、`disconnect`(:347)、`isUserOnline`(:475，Mongo UserSession)。
`tests/unit/consistency/websocket-consistency.test.js` 会校验事件名与载荷——改名必须同步前后端。

### 6. 前端职责

| 文件 | 职责 |
|---|---|
| `services/trtcService.js` | 纯 HTTP 封装 `/api/trtc/*`（`getAuth(roomId)` 不带 roomId 只探可用性） |
| `services/trtcRoomService.js` | 按需 CDN 加载 `trtc-sdk-v5`（`:25-37`）+ 进/离房与远端视图绑定 |
| `services/callService.js` | 通话门面与通道策略：`getChannel()` 取 `/api/config/call`、`isTRTCAvailable()`、分派 + 计时 + 发 socket 事件 |
| `services/webrtcCallService.js` | 自建 WebRTC：RTCPeerConnection、本地/远端流、全局信令监听（`attachSignalListeners`，`:81-101`） |
| `views/AudioCall.vue` / `VideoCall.vue` | 仅消费 `socketService.on('call_end')`（AudioCall:180、VideoCall:199） |
| `App.vue:122` + `components/IncomingCall.vue:80-81` | 来电侧消费 `call_invite` / `call_cancel` / `call_reject` |

### 7. 部署侧（`docker-compose.yml:269-282`）

- coturn：`coturn/coturn:latest`（**浮动 tag，D-2 遗留**）、`network_mode: host`、`profiles: ["turn"]`、`--use-auth-secret --static-auth-secret=${TURN_SECRET:-change-me-in-env}`、`--min-port=49160 --max-port=49200`、`--no-tls --no-dtls`。
- 环境变量：根 `.env` → `TURN_REALM` / `TURN_SECRET` / `TURN_EXTERNAL_IP`；`backend/.env` → `CALL_CHANNEL` / `TURN_URL` / `TURN_SECRET` / `TURN_TTL`、`STUN_URLS`。
- 需放行：`3478/udp+tcp` 与 `49160-49200/udp`。**nginx 无需新增端口**：WebRTC 信令走既有 `location /socket.io/`（`nginx/conf.d/default.conf:55`、`default.ssl.conf:45`），TURN 走 host 网络直连。

## Verification

```powershell
cd backend; npx jest tests/unit/services/trtc.test.js tests/unit/services/callBillingService.test.js
cd backend; npx jest tests/unit/controllers/trtc.test.js tests/unit/controllers/p2p.test.js tests/unit/utils/p2pRelay.test.js
cd backend; npx jest tests/unit/consistency/websocket-consistency.test.js
cd backend; npm test
```

真实服务验证（`.e2e-run/`，前置：后端 3000 + 前端 5174 + `tokens*.json` + 本机 Edge；**仅 use 真实服务，不写生产**）：

| 脚本 | 作用 | 前置 | 写库 |
|---|---|---|---|
| `two-party-call.js` | 双上下文真实通话，断言双端 `connectionState=connected` 且 inbound-rtp 字节 >0 | 后端 3000、前端 5174、`tokens.json` | 是（走 /api/trtc/*，产生通话单） |
| `p2p-runner.js` / `p2p-video-runner.js` | 自动拉起后端与 vite，跑语音/视频页并截图 | `tokens2.json` | 是 |
| `turn-relay-probe.js` | 收集 ICE 候选统计 host/srflx/relay | 后端 3000（读 /api/config/call） | 否 |
| `trtc-detect-verify.js` | 用**假密钥**验 `/api/trtc/auth` 与前端通道徽标 | 后端 3000、前端 5174 | 否 |
| `run-call-suite.js` | 一键跑 probe-channel / --trtc / two-party-call / turn-relay-probe | 同上 | 间接 |
| `callcheck.js` | 轻量冒烟：打开发音/视频页截图 | 前端 5174 | 可能 |
| `check-turn.js` | 裸浏览器 ICE 探测直连 coturn | Edge + 可达 TURN | 否 |

退出码语义：`turn-relay-probe.js` = 0 表示「有 relay 或 TURN 未配置（跳过）」，1 表示「已配置但无 relay」；本机未部署 coturn 时 relay=0 属**预期**，不是故障。

## Pitfalls

- 照 `trtcService.startBilling/endBilling/createRoom` 推断业务：它们是**内存桩**，真实计费在 `callBillingService.endCall`。
- 改状态枚举只改 `callBillingService`，忘了 `trtcService` 的 `ENTERABLE_CALL_STATUS`/枚举表与清理器。
- 改 socket 事件名不同步前端（含 `websocket-consistency.test.js`）。
- 忘了清理器的注册点在 `server.js:486-492`（listen 回调内），改完不重启不生效。
- 在没部署 coturn 的环境把 `relay=0` 当故障（本机双上下文只用 host 候选）。
- `TURN_SECRET` 与根 `.env` 不一致 / 仍是公开占位 `change-me-in-env` → 启动自检告警、跨 NAT 打不通。

## 只能在真机/公网验证（如实标注，别在本地宣布通过）

真实 TURN 中继（对称 NAT、4G/5G 下必须出现 `relay` 候选）、跨设备跨 NAT 的 ICE 打通与媒体质量、真实 TRTC 密钥下腾讯服务端接受 UserSig（`trtc-detect-verify.js` 只用假密钥验签名格式）、运营商/企业防火墙、真实余额下的多端并发计费与分账。对应记录位置：`人工与外部依赖验证清单.md`。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：通话链路改动实现/审查员。仓库 C:\Users\admin\Desktop\kaifa。
任务：<改动点>（trtc / p2p / 计费 / 清理器 / 通道策略 / TURN 配置）。
硬约束与事实：① 通道由 GET /api/config/call 下发，默认 webrtc，TRTC 为手动开关且不可用回退；
② 房间成员真相来自 xn_call_record，requireEnterableRoom 仅允许 status 0/1；
③ trtcService 的 createRoom/startBilling/endBilling 是内存桩（不写库），真实计费只在 callBillingService.endCall：
   仅 is_companion_call===1 且 duration>0，免费 180s 后按 60s 向上取整，单价 1 元/分钟，事务内原子扣 money，
   陪玩加 gift_money=totalFee*0.7；endCall 先提交 status=4 再计费（已知中间态，改前先评估）；
④ 状态枚举 0 calling/1 active/2 rejected/3 cancelled/4 ended/5 unanswered，改动须同步 trtcService、
   callRecordCleanup（status=0 超 120s → 5）与前端；⑤ socket 事件名前后端必须一致（有一致性测试）；
⑥ TURN 密钥须与根 .env 的 coturn 值一致。
环境：Windows PowerShell（用 ; 不用 &&）；node/npm 可用；docker/git 不可用（编排只做静态核对）。
验证：cd backend; npx jest tests/unit/services/trtc.test.js tests/unit/services/callBillingService.test.js
  tests/unit/controllers/trtc.test.js tests/unit/utils/p2pRelay.test.js；真实链路用 .e2e-run/two-party-call.js
  （会写库，仅本地库）并清理数据。relay 候选为 0 时须先确认 coturn 是否部署，不要直接判失败。
报告：改动点 → 状态机/计费影响（file:line）→ 单测退出码与结果 → 真机/公网未验证项及原因。
```
