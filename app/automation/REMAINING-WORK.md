# 后续工作清单（2026-10-19）

已完成：H5 代码迁移、53 页冒烟、239 单测、H5/App 资源构建、卡密/钱包/提现 mock 端到端。
以下只列**还没完成**的工作；工时是 1 名前端 + 1 名后端配合的粗估。

| 优先级 | 工作项 | 具体内容 | 依赖/需要你提供 | 预计 | 验收标准 |
|---|---|---|---|---|---|
| P0 | HBuilderX 自定义基座编译插件 | 导入 `app/`，设 `VITE_USE_NATIVE_CALL=1`，打自定义基座；修 Kotlin/UTS 编译错误 | HBuilderX 稳定版、DCloud 账号、临时包名 | 1–3 天 | 基座能编译、App 能启动、插件初始化成功 |
| P0 | 真机权限与基础通话 | 相机/麦克风/通知权限、ICE 连接、扬声器/听筒、挂断 | 华为 Mate 30 Pro、真我 Neo7 | 2–4 天 | 两台真机能互相听到声音 |
| P0 | 后台保音 | 前台服务、音频焦点、锁屏/切后台、厂商白名单 | 同上 | 1–2 天 | 锁屏/切后台 5–10 分钟通话不断 |
| P0 | 视频渲染与覆盖层 | SurfaceView 与 WebView 层级、本地小窗/远端全屏、Vue 控件遮挡 | 同上 | 2–4 天 | 视频画面可见、静音/挂断按钮可点 |
| P0 | 接入 callService/通话页 | 用 `nativeCallAdapter` 替换 App 端 `webrtcCallService`；H5 保持原逻辑 | P0 前 4 项通过 | 3–5 天 | App 能主叫/被叫，H5 不受影响 |
| P0 | 上传页面改用 mediaPicker | EditProfile、PublishPost、Feedback、MyAlbum、MyServices、Online/OfflineApplyForm、RealName、Withdraw、report-modal | 真机 | 2–3 天 | App 端头像/动态图/视频/收款码能选能传 |
| P0 | socket 真机验证 | App 端 WebSocket、token、重连、来电/聊天事件 | 后端测试环境 | 1–2 天 | 真机实时收发消息/来电事件 |
| P1 | 部署测试后端 | 服务器/域名/HTTPS/MySQL/Redis/Mongo/coturn | 你的服务器与域名 | 1–2 天 | `/health` 正常、H5 能访问 |
| P1 | 真实接口联调 | `VITE_API_ORIGIN` 指向测试域名；登录/短信/首页/聊天/钱包/卡密/提现 | 测试账号、短信配置 | 3–5 天 | 核心链路真实数据跑通 |
| P1 | 真实密卡充值 | 管理端生成卡密、用户端核销入账、对账 | 管理端账号 | 1–2 天 | 一张真实卡密到账 |
| P1 | 真实上传 | COS Bucket/CORS 或后端中转 | COS 配置 | 1–2 天 | 图片/视频/音频真实可访问 |
| P1 | coturn/通话后端 | `TURN_URL/STUN/TURN_SECRET`、`CALL_CHANNEL=webrtc`、通话计费 | 公网 coturn | 1–3 天 | 不同网络下能通话 |
| P2 | App 打包资料 | 最终包名、图标/启动图、keystore、DCloud AppID、targetSdk/ABI | 你的资料 | 1 天 | manifest 配置完成 |
| P2 | HBuilderX 云打包 APK | 签名、云打包、安装 | DCloud 账号/证书 | 0.5–1 天 | 真机可安装运行 |
| P2 | 内测分发/合规 | 隐私政策、权限说明、App 备案（如需上架） | 主体资料 | 2–5 天 | 能内测分发/通过审核 |
| P2 | 应用商店上架 | 软著、商店账号、审核材料 | 公司资料 | 1–2 周 | 商店可下载 |
| P3 | H5 切 nginx | 改挂载 `app/dist/build/h5`，staging 回归，切主域 | 运维窗口 | 1–2 天 | 新 H5 上线、旧链接可用、可回滚 |
| P4 | iOS（如需要） | WKWebView/原生 TRTC、IAP、CallKit、审核 | Apple 账号 | 数周 | iOS 审核通过 |
| P4 | 离线推送/来电 | uni-push/厂商推送、前台服务、CallKit | 厂商账号 | 1–2 周 | App 被杀后能收来电/消息 |
| P4 | 监控/CI | Bugly/崩溃、自动构建、冒烟流水线 | 账号 | 3–5 天 | 崩溃可见、发布自动化 |

## 最短可上线路径

1. HBuilderX 编译插件 → 2. 真机基础通话 → 3. 接 callService → 4. 后端+coturn 联调 → 5. 打包 APK → 6. 内测。

## 需要你提供

- HBuilderX + DCloud 账号 + 临时/最终包名
- Android 真机（Mate 30 Pro / 真我 Neo7）
- 测试后端域名/服务器/HTTPS
- 公网 coturn/TURN 凭据
- COS/SMS/管理端卡密账号
- 如要上架：软著、隐私政策、App 备案资料
