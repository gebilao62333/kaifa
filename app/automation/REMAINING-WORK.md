# 后续工作清单（2026-10-20 状态更新）

> **2026-10-20 22:30 状态同步**：P1「后端部署」**已完成**（Sealos 线上 `https://fazwhznenrqo.sealoshzh.site`，`/api/health` 200，当前镜像 `kaifa-app:v1.0.7`）；P1「真实接口联调」**部分完成**（health、用户手机号+密码登录、钱包真实数据、管理员登录、图片上传、Socket.IO handshake 已在线上验证，见 `deploy/sealos/DEPLOYED-2026-10-20.md`）。P0 真机六项与 P2/P3/P4 仍然有效。迁移/发布口径见根目录 `Sealos部署核对清单.md`。

## 本轮已完成（代码层，本机可验证）

- **App 上传链路**：`mediaPicker` + `uploadService` App 分支；10 个上传入口全部接入
- **App 原生 WebRTC 接入**：`nativeCallAdapter` 事件总线 + `nativeCallService` + `webrtcCallService` 门面 + 通话页适配
- **UTS 插件参与构建**：`build:app` 已生成 `index.kt`；新增 `@dcloudio/uni-uts-v1`；修 UTS 真值判断、Kotlin Number/Int 类型
- **App 兜底**：P2P 取数 App 显式回退签名 URL；逆地理编码 fetch → uni.request
- **旧版差异补齐**：主 Tab 左右滑动 + 过渡动画、全局错误兜底（index 内联 + errorHandler + ErrorBoundary + 全局兜底层）、`router.options` 兼容、PC 样式壳、dev 代理 charset（详见 `GAP-AUDIT-2026-10-20.md`）
- **验证**：252 单测 / 53 页冒烟 0 错误 / H5+App 构建 / `task:auto` 全绿

## 仍需外部环境（按优先级）

| 优先级 | 工作项 | 具体内容 | 依赖 | 预计 | 验收标准 |
|---|---|---|---|---|---|
| P0 | HBuilderX 自定义基座 | 导入 `app/`，`VITE_USE_NATIVE_CALL=1`，打自定义基座，修 Kotlin/AAR 编译错误 | HBuilderX + DCloud 账号 + 临时包名 | 1–3 天 | 基座编译、App 启动、插件 init 成功 |
| P0 | 真机权限与通话 | 相机/麦克风/通知、ICE、扬声器/听筒、挂断、切换摄像头 | Mate 30 Pro / 真我 Neo7 | 2–4 天 | 两台真机互通 |
| P0 | 后台保音 | 前台服务、音频焦点、锁屏/切后台、厂商白名单 | 同上 | 1–2 天 | 锁屏/切后台 5–10 分钟不断 |
| P0 | 视频渲染层级 | SurfaceView 与 WebView 叠层、本地小窗/远端全屏、控件遮挡 | 同上 | 2–4 天 | 画面可见、按钮可点 |
| P0 | App 上传真机验证 | 选图/拍照/视频、临时路径预览、uni.uploadFile、表单回填 | 真机 | 1–2 天 | 头像/动态图/视频/收款码/证件照能选能传 |
| P0 | socket 真机验证 | WebSocket、token、重连、来电/聊天事件 | 后端测试环境 | 1–2 天 | 实时收发正常 |
| P1 | 后端部署 ✅ **已完成（2026-10-20）** | Sealos 托管 MySQL/Mongo/Redis + 后端应用；线上 `/api/health` 200 | 用户服务器 | 1–2 天 | `/health` 正常 |
| P1 | 真实接口联调 ◐ **部分完成（2026-10-20）** | 已验证：health、手机号登录、钱包、管理员登录、图片上传、Socket.IO；**仍缺**：真实短信通道、支付、TURN/coturn，以及登录后各业务页的真实数据回归 | 测试账号、短信配置 | 3–5 天 | 核心链路真实数据跑通 |
| P1 | 真实密卡/上传 | 管理端生成卡密、COS 或后端中转 | 管理端账号、COS | 1–2 天 | 真实卡密到账、媒体可访问 |
| P1 | coturn/通话后端 | TURN/STUN、`CALL_CHANNEL=webrtc`、计费 | 公网 coturn | 1–3 天 | 跨网络通话 |
| P2 | 打包资料与云打包 | 包名、图标/启动图、keystore、DCloud AppID、targetSdk/ABI；云打包 APK | 用户资料/证书 | 1–2 天 | 真机可安装 |
| P2 | 内测分发/合规 | 隐私政策、权限说明、备案 | 主体资料 | 2–5 天 | 可内测 |
| P3 | H5 切 nginx | 挂载 `app/dist/build/h5`，staging 回归后切主域 | 运维窗口 | 1–2 天 | 新 H5 上线可回滚 |
| P4 | iOS / 离线推送 / 监控 CI | WKWebView+原生 TRTC、uni-push/CallKit、Bugly/CI | Apple/厂商账号 | 数周 | 按需 |

## 已知限制（2026-10-21 迁移缺口收口后）

1. ~~**App 端语音介绍（MyServices）**：录音仍是 WebView MediaRecorder 的 `blob:`，没有可上传的本地路径~~ ✅ **已收口**：新增 `src/services/audioRecorder.js`（uni.getRecorderManager），聊天语音/入驻语音/语音介绍三处双分支，App 直传本地临时路径、试听 `uni.createInnerAudioContext`。
2. **申请表单图片上传**：Online/OfflineApplyForm 仍在子组件内先上传再回填 URL（父组件依赖 FileReader），App 端已由 mediaPicker 接管选图；若要严格共用父逻辑需重构 `CompanionApply.vue`（功能不受影响）。
3. **MyAlbum**：App 端单批最多 9 张（`uni.chooseImage` 上限），H5 保持一次不限张数。
4. **P2P 取数**：App 原生通道未开放 DataChannel，`p2pFetch` 直接回退签名 URL（不影响主流程）。
5. **个别机型 size=0**：`uni.chooseImage` 若返回 size=0，`uploadService` 会按「文件内容为空」拦截；录音产物已用 `getFileInfo` 兜底并最小置 1。
6. **Kotlin 未编译**：CLI 只验证到 UTS→Kotlin 生成；`KaifaWebRTC.kt` 的 PeerConnection.Observer 方法集、stream-webrtc 1.3.9 API 需 HBuilderX 实测修正。
7. ~~**span/p 未转 text**~~ ✅ **已收口（2026-10-21 残余 P2 批）**：1155 对 span→text、24 对 p→view，CSS 选择器同步；MyReserve slot-chip 转 view、CardRecharge 用 `:not(.result-icon)`。视觉回归待真机/浏览器。
8. ~~**主 Tab 用 `uni.reLaunch` 状态不保留**~~ ✅ **已收口**：新增 `common/tabState.js`（快照+30s TTL+账号隔离+uni.storage 双写），Home/Square/Preferred/Mine 恢复滚动/列表/筛选；App.vue onLaunch 清缓存仅本次会话有效。真机 onHide/onShow 时序待验。
9. **App 分享链接**：依赖构建期 `VITE_API_ORIGIN`，未注入时复制的是相对路径（需核对 `app/.env.production`）。
10. **剩余直读 localStorage**：AudioCall/VideoCall 等少数位置仍读 `_pendingCallMode`（写入端已双写），WebView 内正常，原生侧读取待统一。
11. **真机未验**：录音/选媒体/定位/剪贴板/分享/网络状态/冷启动/第三方登录/表单 picker/tabState 跨 WebView 仅代码层 + 编译验证。
12. **旧站已删除**：`frontend/` 2026-10-21 删除，备份 `.e2e-run/legacy-frontend-backup-2026-10-21/`（不入库）；回滚只能回滚镜像/备份。


## 最短可上线路径

1. HBuilderX 自定义基座（修 Kotlin）→ 2. 真机基础通话 → 3. 真机上传/socket → 4. 后端+coturn 联调 → 5. 打包 APK → 6. 内测 → 7. H5 切 nginx

## 需要你提供

- HBuilderX + DCloud 账号 + 包名
- Android 真机（Mate 30 Pro / 真我 Neo7）
- 测试后端域名/服务器/HTTPS
- 公网 coturn/TURN 凭据
- COS/SMS/管理端卡密账号
- 上架资料（软著、隐私政策、备案）
