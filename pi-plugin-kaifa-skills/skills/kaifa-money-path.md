---
name: kaifa-money-path
description: "kaifa 资金链路改动：支付/钱包/提现/卡密/红包/VIP 的幂等写入点、金额单位、对账口径与验证探针。"
whenToUse: "改动落在 pay/wallet/withdraw/card/gift/redpacket/vip/level 的服务、控制器或迁移上。"
tags: ["自习"]
---

# kaifa 资金链路（支付 / 钱包 / 提现 / 卡密 / 红包 / VIP）

工作区根：`C:\Users\admin\Desktop\kaifa`。本链路的核心不是功能，而是**幂等、单位、对账口径**三件事；历史上真出过资金缺陷（并发刷币 TOCTOU，见《密卡充值验证与遗留项说明.md》§1.3）。

## When to Use

- 改动落在 `services/{payService,wechatPayService,walletService,giftService,vipService,levelService,skinService}.js` 或对应 controller / route / 迁移。
- 排查「重复入账 / 少扣 / 多退 / 余额为负」类问题。

## Procedure

### 1. 路由 → 控制器 → 服务

| 领域 | 路由 | 控制器 | 服务 |
|---|---|---|---|
| 订单/支付/回调 | `routes/pay.js:25-33,49` | `controllers/pay.js` | `services/payService.js`、`services/wechatPayService.js` |
| 卡密 | `routes/pay.js:39,40,41` | `controllers/pay.js` | `payService.js`（`validateCard` / `useCard` / `redeemCardByKey`） |
| 钱包/提现 | `routes/pay.js:42,44,47`、`routes/wallet.js:23-35` | `controllers/pay.js`、`controllers/walletController.js` | `payService.js`、`services/walletService.js` |
| 礼物/红包 | `routes/gift.js:50-57` | `controllers/gift.js` | `services/giftService.js` |
| VIP | `routes/vip.js:15-20` | `controllers/vip.js` | `services/vipService.js` |
| 装扮扣款 | `routes/user.js:30` | `controllers/user.js` | `services/skinService.js:183` |
| 提现审核（后台） | `routes/admin.js`（`approveWithdraw:692` / `rejectWithdraw:724`） | `controllers/admin.js` | — |

### 2. 幂等写入点（改资金逻辑必须保持这些判定）

| 场景 | 真源 | 幂等手段 |
|---|---|---|
| 充值入账 | `services/payService.js:121-129` | `OrderChong.update({status:1},{where:{id,status:0},transaction})` + **affected=0 即抛「订单已入账」**；`:112-116` 用 `toCents(order.amount)` 比对实付；`:106-108` 要求 `verified === true` |
| 卡密核销 | `payService.js:258-278`（`consumeCardOnce`） | `Card.update({status:1},{where:{id,status:0},transaction})` + 影响行数判定；`redeemCardByKey:294` 按 `card_key` 查 |
| 微信回调 | `services/wechatPayService.js:218-232` | `status===1` / 已入账 → 直接回成功（幂等响应）；`:181-182` 签名不符拒绝 |
| 提现审核 | `controllers/admin.js:699-705`（通过）、`:748-755`（驳回） | `where:{id,is_check:0}` + 影响行数；**抢不到即不退款**（`:757-760`） |
| 提现申请扣款 | `services/walletService.js:381-390` | 事务内 `User.decrement('money',{ ..., where:{ money: {[Op.gte]: amount} } })`，影响行数 ≠1 抛「可提现余额不足」 |
| 礼物提现双扣 | `services/giftService.js:166-189` | 先 `gift_money` 再 `money`，任一条件扣不动即抛错 |
| 红包领取 | `services/giftService.js:290` | 单事务内 `FOR UPDATE` 锁行后算金额；**唯一索引** `uk_packet_user(packet_id,user_id)`（迁移 `20261003000001:36`，前置 `:22-25` 去重） |
| 防重复下单 | `payService.js:51-70` | 同用户同金额 2 分钟内未支付订单复用 |

### 3. 金额单位（混用是资损源头）

- 余额单位是**金币**：`utils/currency.js` 的 `EXCHANGE_RATE=10`（1 元 = 10 金币）、`MIN_WITHDRAW_AMOUNT=100`、`WITHDRAW_FEE_RATE=0.05`、`CURRENCY_UNIT='金币'`；导出 `convertToCoins` / `convertToFiat` / `calculateWithdrawFee` / `calculateNetWithdraw` / `normalizeAmount` / `formatCurrency` / `validateGoldCoins` / `validateCurrencyUnit` / `createCurrencyMiddleware`。
- 微信侧是**元**，比对时转**分**：`payService.js:21` `toCents = Math.round(Number(amount)*100)`。
- 直接算 `money` 的位置（改动时要一起看）：`walletService.js:276-277,369-370`、`giftService.js:158`、`controllers/admin.js:676`、`payService.js:112-116,318-319`；前端把金币换回元：`views/Withdraw.vue:17,226,239,269-275`（`/10`、`*0.05`）、`views/PaymentGateway.vue:47,57`。

### 4. 提现 `is_check` 语义与 T-3 存量风险

- 语义：`0=待审核`、`1=已通过`、`2=已拒绝`，`status` 必须同步（`controllers/admin.js:633,715,739`；`walletService.js:191`）。
- 申请即扣款（`walletService.js:381-385`），写单 `is_check:0,status:0,channel:'wallet'`（`:392-409`）。
- 驳回分支：先条件更新为 `is_check:2,status:2`，抢到后 `refundWithdrawByChannel`（`admin.js:762`）。
- ⚠️ **T-3**：`controllers/admin.js:675-690`，尤其 `:687-688` 的 `else if (channel==='wallet' || channel==='admin') { await User.increment('money', {by: refundAmount}) }`——上线前遗留的 `is_check=0` 且旧口径「申请不扣款」的存量单，在新逻辑下驳回会**退一笔从未扣过的 money**。上线前须人工对账（只读 SQL），**不要擅自改历史数据**。`channel` 空值按 gift 处理（`:682`），gift 退两笔（`:684-686`）。

### 5. 表与关键列

| 表 | 关键列 |
|---|---|
| `xn_order_chong` | id/user_id/order_no/amount(元)/coins(到账含赠送)/pay_type/status/pay_time；**无支付流水列**（平台流水号只落日志 `payService.js:140`） |
| `xn_user` | money / gift_money / gift_money_zong / lv / vip_lv |
| `xn_withdraw` | user_id/money/amount/pay_money/shouxufei/type/account/bank/name/mobile/image/**is_check**/status/state/**channel**(默认 gift)/handle_time |
| `xn_card` | card_no/**card_password(明文)**/card_key(25 位,唯一)/type/value/coin_amount/status/use_user_id/use_time |
| `xn_recharge_package` | name/price/coins/bonus_coins/hot/sort/status |
| `xn_red_packet` / `xn_red_packet_log` | packet_id/user_id/amount；唯一 `uk_packet_user` |
| `xn_vip_order` / `xn_vip_package` | user_id/order_no/package_id/price/duration/level/pay_type/status/pay_no |
| `xn_gift_log` / `xn_gift_bag` | 金额列 `totalmoney`、收款 `user_id` |

### 6. 前端接线（改字段要同步）

- `views/PaymentGateway.vue:92` → `payService`（余额/订单状态/兑换/微信下单/回调）
- `views/Recharge.vue:65`（余额 + 套餐）、`views/CardRecharge.vue:75`（`redeemCardByKey`）
- `views/Withdraw.vue:183-184` → `walletService` + `payService`；`views/Wallet.vue:127` → `walletService.getOverview`
- `views/VipCenter.vue:76` → `vipService`
- 提现记录页：`views/WithdrawRecords.vue`（income/withdraw-records）

## Verification

```powershell
cd backend; npx jest tests/unit/services/payServiceCard.test.js tests/unit/services/payServiceSettle.test.js tests/unit/services/wechatPayNotify.test.js
cd backend; npx jest tests/unit/services/walletService.test.js tests/unit/services/giftService.test.js tests/unit/services/vipService.test.js
cd backend; npx jest tests/unit/controllers/admin.test.js tests/unit/controllers/pay.test.js tests/unit/utils/currency.test.js
cd backend; npm test
```

并发类改动（TOCTOU）必须用真实服务验一次：`.e2e-run/concurrency-probe.js`（私密帖解锁 / 红包重复领取 / 抢单，只 SELECT 判余额，经 API 建帖与发红包 → **会写库**）；卡密全链路 `l2-card.js`（**写库**）；清理：`clean-cards2.js`、`clean-card.js`（**直接 DELETE**）、`cleanup-v2.js`（覆盖 `xn_vip_order`/`xn_order_chong`/`xn_withdraw`）。

## Pitfalls

- 用「先读再写」代替条件更新 + 影响行数判定 → 并发下重复入账/多退（历史缺陷根因）。
- 混用元/分/金币；`toCents` 与 `convertToCoins` 用错。
- 驳回提现时无条件 `increment money` → 命中 T-3 存量单多退。
- 红包去重只靠应用层查重，不靠 `uk_packet_user`。
- 已知缺口（如实标注）：`walletService.applyWithdraw` **没有单测覆盖**；`.e2e-run` 下**没有提现驳回退款的专用探针**；`xn_card.card_password` 明文落库（B-10）；`xn_order_chong` 无支付流水列，平台侧流水只能靠日志。
- 相关文档：根目录 `密卡充值验证与遗留项说明.md`（§1.1 链路、§1.2 10/10、§1.3 并发刷币修复、§1.4 其他链路并发排查、§1.5 运维要点）。

## Subagent 简报（路线 A：subagent 不加载技能，必须整段内联）

```
角色：资金链路改动实现/审查员。仓库 C:\Users\admin\Desktop\kaifa。
任务：<改动点>，涉及 <payService/walletService/giftService/vipService/controllers/admin.js 等>。
硬约束：① 一切资金写入必须是「条件更新 + 影响行数判定」（where 带旧状态，如 status:0 / is_check:0），
禁止先读后写；② 余额单位是金币（currency.js，1 元=10 金币），微信比对用分（toCents）；
③ 提现申请即扣款且扣款带 money>=amount 条件；驳回退款前先条件抢单（is_check:0→2）；
④ 红包依赖唯一索引 uk_packet_user，不要只做应用层查重；⑤ 涉及 xn_card 卡密必须走 consumeCardOnce 原子占用。
环境：Windows PowerShell（用 ; 不用 &&）；node/npm 可用；docker/git 不可用。
验证：cd backend; npx jest tests/unit/services/<相关>.test.js tests/unit/controllers/<相关>.test.js；并发类改动另跑
  .e2e-run/concurrency-probe.js（会写库，仅本地库）并清理造的数据。
报告：改动点与幂等实现（file:line）→ 单测退出码与结果 → 并发验证结论或「未验证 + 原因」→ 存量对账影响（T-3/T-4）是否被触及。
```
