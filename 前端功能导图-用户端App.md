# eu搭子 用户端 App 功能导图

覆盖范围：frontend（用户端 App，Vue3 + Pinia + Vue Router）｜口径：53 条路由 / 57 个页面视图 / 30 个服务模块 / 16 个公共组件

## 1. 账号与认证
### 1.1 登录注册
- 密码登录
- 短信验证码登录
- 第三方登录：微信、QQ
- 注册账号
- 找回密码 / 重置密码
- 发送短信验证码、手机号格式校验
### 1.2 会话与鉴权
- Token 本地持久化（localStorage + Pinia 持久化插件）
- 路由级鉴权：meta.requiresAuth 显式声明
- 公开路由白名单兜底（Home/Search/Square/PostDetail 等）
- 未登录拦截跳转登录页
- 登录态恢复（initFromStorage）与退出登录清理
### 1.3 实名认证
- 真实姓名、身份证号
- 身份证正反面上传
- 审核状态：未认证 → 审核中 → 认证成功 / 认证未通过
- 重新提交认证
### 1.4 资料完善度提示

## 2. 首页与发现
### 2.1 首页（/home）
- 顶部搜索入口（用户 / 帖子 / 游戏）
- 交友入口（/friend）
- 开屏弹窗与首页轮播 Banner
- 四宫格快捷导航：线下陪玩、线上陪玩、派单大厅、需求发布
- 热门推荐陪玩师（含头像框装扮展示）
- 平台公告 / 系统通知
### 2.2 搜索（/search）
- 搜索历史
- 热门搜索词
- 分类浏览：游戏 / 用户 / 帖子
- 结果列表与空态
### 2.3 底部导航
- 首页 / 广场 / 消息（未读角标，99+）/ 我的
- 主 Tab 左右滑动切换、页面转场动画

## 3. 社交动态（广场）
### 3.1 广场信息流（/square）
- 动态列表、点赞、评论入口、发布入口
### 3.2 发布动态（/publish-post）
- 图片 / 视频上传
- 选择位置
- 选择话题标签
- 可见范围（谁可以看）
### 3.3 动态详情（/post-detail/:id）
- 点赞 / 取消点赞
- 评论与回复
- 分享、转发
- 私密动态解锁
- 关注作者 / 已关注状态
### 3.4 我的动态（/my-dynamic）
- 动态列表、删除动态
### 3.5 标签话题管理（/tag-manager）
- 标签列表、标签增删改
### 3.6 社交关系
- 我的关注（/follows）
- 我的粉丝（/fans）
- 获赞记录（/likes-records）
- 访客记录（/visitors-records）
### 3.7 用户主页（/user/:id）
- 资料头卡：关注 / 粉丝 / 获赞
- 基本信息、兴趣爱好、擅长游戏、相册
- 服务状态：线上服务、线下服务
- 私信、预约入口

## 4. 陪玩服务业务（核心业务域）
### 4.1 服务发现
- 陪玩列表（/companion-list）：线上陪玩 / 线下陪玩分类
- 游戏分类（/game-index）：全部 / 热门 / 新人、关注
- 陪玩师详情：评分、接单数、服务标签、价格、服务状态
- 入口动作：聊天、立即预约
### 4.2 需求与派单
- 发布需求（/publish-demand）
  - 服务类型：线上陪玩 / 线下陪玩
  - 选择游戏、服务地点、详细地址
  - 选择日期、开始时间、结束时间、服务时长
  - 预算金额（含建议价提示）
  - 备注信息、协议确认
- 派单大厅（/paidan）：全部 / 最新 / 热门、订单详情、立即接单
- 需求列表 / 详情 / 取消
### 4.3 陪玩师入驻
- 申请服务（/companion-apply）：协议确认 → 线上陪玩 / 线下陪伴分流
- 线上陪玩申请表
  - 所在城市、技能等级
  - 接单大区、擅长位置、陪玩类型
  - 设置价格（币/段）
  - 技能介绍、语音介绍、技能凭证图片
- 线下陪伴申请表
  - 所在城市、技能介绍、价格（币/次）、语音介绍、凭证图片
- 权限引导：相机 / 麦克风 / 相册授权说明与「不使用」降级路径
- 申请状态查询
- 我的服务（/my-services）：服务列表、编辑、上架 / 下架、去申请
### 4.4 订单全流程（/my-order）
- 状态流转：待接单 → 已接单 → 进行中 → 已完成（可取消 / 申诉）
- 订单操作：取消订单、服务结束、联系陪玩
- 订单评价：星级评分 + 评价内容、已评价展示
- 订单申诉
- 订单统计
### 4.5 预约体系（/my-reserve）
- 预约状态、陪玩师、服务项目、预约时间、预约号、下单时间
- 取消预约、联系对方
- 可预约时段管理（创建 / 开关时段）
- 预约确认 / 拒绝 / 完成

## 5. 即时通讯 IM
### 5.1 消息中心（/preferred）
- 会话列表、消息与通知分区
- 在线客服入口
- 加载态、空态
### 5.2 交友列表（/friend）
- 用户列表、加载中 / 重新加载 / 暂无用户
### 5.3 聊天室（/chat-room/:id）
- 消息类型：文本、图片、视频、语音、位置、礼物、红包、系统消息
- 输入能力
  - 文本输入与发送
  - 表情面板（分组 / 分页）
  - 语音录制（录制时长展示）
  - 拍照 / 相册 / 视频选择
  - 更多功能面板（图片 / 视频 / 位置 / 礼物 / 红包）
- 位置发送：省 / 市 / 区 / 街道四级选择 + 当前定位
- 消息操作：撤回、复制、转发给好友、发送失败重发、长按菜单
- 会话能力：已读回执、输入中提示、时间分隔与日期分组、滚动加载历史消息
- 隐私能力：时间自动撤回、已读自动销毁（阅后即焚）
- 用户操作：查看资料、拉黑、举报
- 媒体预览：图片预览、视频预览、语音播放
- 互动能力：送礼面板与礼物动效、红包面板
- 通话入口：语音通话、视频通话（展示通话费率）
### 5.4 未读体系
- 会话未读、通知未读、总未读数
- 底部导航消息角标

## 6. 语音 / 视频通话
### 6.1 通话流程
- 发起呼叫、接听、拒接、取消呼叫、挂断
- 通话计时
- 全局来电弹窗
### 6.2 通话状态
- 呼叫中、已接通、已拒接、已取消、已结束、无人接听、异常
### 6.3 技术通道
- TRTC 通道：鉴权、创建房间、进房 / 退房、远端画面渲染
- WebRTC 通道：信令、Offer/Answer、ICE 候选、本地媒体采集
- 自动降级与 P2P 兜底
### 6.4 通话控制
- 麦克风开关、摄像头开关、扬声器切换
### 6.5 通话记录与计费
- 通话历史记录
- 每分钟费用计费

## 7. 礼物与互动
- 礼物列表与赠送
- 礼物背包
- 礼物特效动画
- 红包：发送、领取、红包记录
- 分享弹窗：内容分享

## 8. 钱包与支付
### 8.1 钱包（/wallet）
- 总资产
- 今日概览：今日收入、今日支出
- 累计收入、累计提现
- 收入来源构成与合计
- 交易记录入口：收入 / 支出 / 提现明细
### 8.2 充值（/recharge）
- 充值套餐与自定义金额
- 支付方式：支付宝 / 微信 / 银行卡 / 余额
- 支付金额确认
- 支付网关（/payment-gateway）：卡号密码、金币支付、支付处理中 / 支付成功
- 卡密充值（/card-recharge）：卡密校验与兑换
### 8.3 提现（/withdraw）
- 可提现余额、手续费、提现金额、全部提现
- 提现渠道：支付宝 / 微信零钱 / 银行卡
- 收款信息：收款人姓名、银行卡号、开户银行、支付宝账号、微信账号、收款二维码上传
- 预计到账金额与到账方式
### 8.4 交易记录
- 收入明细（/income-records）：收入总额、笔数、明细
- 支出明细（/expense-records）：支出总额、笔数、明细
- 提现明细（/withdraw-records）：累计提现、提现次数、可提现余额、提现渠道

## 9. 会员与增值特权
### 9.1 VIP 中心（/vip-center）
- 会员档位：黄金会员 / 铂金会员 / 钻石会员
- 套餐周期：1 个月 / 季度 / 半年 / 1 年
- 专属特权：专属头像框、身份标识、隐身访问、等级加速、优先匹配、装扮商城、专属客服
- 下单与订单状态查询
### 9.2 特权落地页
- 等级加速（/level-acceleration）：经验值、VIP 加速效果、经验获取规则、等级权益
- 身份标识（/identity-badge）：标识预览、当前使用
- 专属头像框（/avatar-frame）：头像框预览与使用
- 隐身访问（/stealth-visit）：隐身模式、隐藏在线状态、隐身浏览动态、屏蔽通知提醒、规则说明
- 优先匹配（/priority-matching）：优先队列、预计匹配时间、匹配设置（优先推送 / 智能推荐 / 自动接单 / 同城优先）、数据统计
- 装扮商城（/skin-shop）：头像框、身份标识、聊天气泡、主题皮肤，购买与使用
### 9.3 等级体系
- 用户等级 1–10 级（新手 → 王者）
- VIP 等级 VIP1–VIP5
- 用户偏好设置持久化（特权开关）

## 10. 个人中心
### 10.1 我的（/mine）
- 资料头卡：关注 / 粉丝 / 获赞 / 访客
- 功能宫格：我的钱包、我的订单、我的服务、申请服务、我的动态、我的相册、我的预约、我的举报、VIP 会员、设置、在线客服
### 10.2 编辑资料（/edit-profile）
- 基本信息：头像、昵称、性别、生日、所在地区、身高、职业、个人介绍、个性签名
- 社交信息：微信号、手机号、邮箱
- 兴趣爱好、擅长游戏、陪玩价格
- 主页装扮：主页背景、个人标签
- 认证信息：实名认证、VIP 会员
- 资料完善度、主页预览
### 10.3 我的相册（/my-album）
- 照片列表、浏览数、获赞数
- 添加照片、删除照片
- 隐私设置
### 10.4 设置（/settings）
- 账号与安全：编辑资料、实名认证、绑定 / 更换手机号、修改密码
- 通用设置：消息通知、深色模式、导航动画、VIP 设置、清理缓存
- 消息通知开关：私信、点赞、评论、关注、系统、订单、礼物、活动、预约
- 隐私设置：显示在线状态、显示位置信息、允许访客记录、允许被搜索、时间自动撤回、已读自动销毁、每分钟费用
- 其他：关于我们、意见反馈、退出登录
### 10.5 举报（/my-reports）
- 举报提交（举报类型、原因）
- 我的举报列表、举报详情
- 处理状态与处理结果、提交时间
### 10.6 意见反馈（/feedback）
- 反馈类型、反馈内容、上传图片、联系方式
- 我的反馈记录
### 10.7 客服与平台信息
- 在线客服（/customer-service）：客服会话、客服人员、其他渠道、客服热线、常见问题
- 关于我们（/about-us）：用户协议、隐私政策、版本更新、给我们评分、联系客服、公司信息
- 404 页面（兜底）

## 11. AI 陪聊（虚拟用户）
- 虚拟人列表（/ai-chat）：列表、加载态、空态
- AI 聊天（/ai-chat/:id）：消息发送、聊天记录
- 清空上下文
- 虚拟用户信息查询与状态

## 12. 平台与基础设施
### 12.1 状态管理（Pinia）
- user-info：token、用户资料、登录态、余额、积分、等级、VIP、关注 / 粉丝 / 获赞数、平台配置、UI 状态
- chat：会话列表、消息列表、未读数（会话 / 通知 / 总计）、消息分页、Socket 连接状态
### 12.2 网络与实时通信
- 服务层 30 个模块统一封装业务接口
- Socket 长连接：连接 / 心跳 / 重连、typing、private_message、message:read、revoke_message
- P2P 浏览器直传与升级兜底
- 网络状态监听与离线提示
### 12.3 全局组件（App.vue 挂载）
- ErrorBoundary 错误边界
- Toast 全局提示
- IncomingCall 全局来电弹窗
- NetworkStatus 网络状态条
- SplashPopup 开屏弹窗
- BottomNav 底部导航
### 12.4 业务公共组件
- PageLayout 页面布局
- EmptyState 空状态
- SharePopup 分享弹窗
- ReserveModal 预约弹窗
- RedPacketPanel 红包面板
- gift-list 礼物列表
- report-modal 举报弹窗
- HomeBanner / HomeQuickNav / HomeRecommend 首页组件
### 12.5 体验与兼容
- 路由懒加载 + 图片懒加载指令 + 图片兜底
- 开屏屏与启动流程
- 页面转场动画、导航动画、深色模式
- PC 端响应式适配
- 媒体权限引导（相机 / 麦克风 / 相册）与降级方案
### 12.6 声明式常量
- 订单 / 预约 / 通话 / 审核状态枚举
- 消息类型枚举（文本 / 图片 / 视频 / 音频 / 位置 / 礼物 / 红包 / 系统）
- 等级枚举（1–10 级）、VIP 等级枚举（VIP1–VIP5）
- 正则校验（手机号 / 邮箱 / 身份证）
- 分页与定时器策略常量

## 附录 A：页面 / 路由索引
### 主流程页面
- /home 首页 — homeService
- /square 广场 — circleService
- /preferred 消息 — chatStore / chatService
- /mine 我的 — userStore
- /login 登录 — userStore
- /search 搜索 — homeService / searchService
- /friend 交友列表 — homeService
### 社交内容
- /post-detail/:id 动态详情 — circleService
- /publish-post 发布动态 — circleService / tagService / regionService
- /my-dynamic 我的动态 — circleService
- /tag-manager 标签管理 — tagService
- /user/:id 用户主页 — authService / reserveService / gamesService
- /follows 我的关注 — authService
- /fans 我的粉丝 — authService
- /likes-records 获赞记录 — authService
- /visitors-records 访客记录 — authService
### 陪玩服务
- /companion-list 陪玩列表 — homeService
- /game-index 游戏分类 — gamesService
- /paidan 派单大厅 — gamesService
- /publish-demand 发布需求 — demandService
- /companion-apply 申请服务 — regionService / gamesService / uploadService
- /my-services 我的服务 — gamesService / uploadService
- /my-order 我的订单 — orderService
- /my-reserve 我的预约 — reserveService
### IM 与通话
- /chat-room/:id 聊天室 — chatService / giftService / socketService
- /call/:id/audio 语音通话 — callService / webrtcCallService / trtcRoomService
- /call/:id/video 视频通话 — callService / webrtcCallService / trtcRoomService
### 钱包与支付
- /wallet 钱包 — walletService
- /recharge 充值 — payService
- /card-recharge 卡密充值 — payService
- /payment-gateway 支付网关 — payService
- /withdraw 提现 — walletService / payService
- /income-records 收入明细 — walletService
- /expense-records 支出明细 — walletService
- /withdraw-records 提现明细 — walletService
### 会员与特权
- /vip-center VIP 中心 — vipService
- /level-acceleration 等级加速 — levelService
- /identity-badge 身份标识 — userPrefService
- /avatar-frame 专属头像框 — userPrefService
- /stealth-visit 隐身访问 — userPrefService
- /priority-matching 优先匹配 — userPrefService
- /skin-shop 装扮商城 — skinService
### 个人中心
- /edit-profile 编辑资料 — authService / uploadService / regionService
- /my-album 我的相册 — albumService
- /settings 设置 — notificationService
- /real-name 实名认证 — authService / uploadService
- /my-reports 我的举报 — reportService
- /feedback 意见反馈 — feedbackService
- /customer-service 在线客服 — 静态页
- /about-us 关于我们 — 静态页
### AI 与兜底
- /ai-chat 虚拟人列表 — virtualUserService
- /ai-chat/:id AI 聊天 — virtualUserService
- /* 404 页面

## 附录 B：梳理结论与关注点
- 业务主线：找陪玩/找游戏搭子 → 沟通（IM / 通话）→ 下单 / 预约 → 履约 → 评价与结算（钱包 / 提现），社交动态与 VIP 特权作为留存与变现的两条侧翼。
- 三大变现路径：陪玩订单抽成与金币消耗、VIP 会员与装扮商城、礼物与红包互动。
- 权限设计：用户端以「路由 meta.requiresAuth + 公开白名单」实现页面级鉴权，真正的接口鉴权在后端。
- 工程观察：57 个页面视图中有 4 个（OnlineApplyForm / OfflineApplyForm / OnlineCompanion / OfflineCompanion）不是独立路由，而是「申请服务」页内嵌的子表单视图；/tag-manager 目前在页面内没有可见入口，属仅路由可达。
- 页面体量 TOP5：ChatRoom（2627 行）、PublishDemand（1723 行）、MyServices（1599 行）、CompanionApply（1430 行）、Settings（1172 行），是后续拆分重构的重点。
