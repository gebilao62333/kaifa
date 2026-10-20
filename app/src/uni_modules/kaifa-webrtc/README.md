# kaifa-webrtc（Android UTS 插件）

目标：App 端用 Google WebRTC（Maven: `io.getstream:stream-webrtc-android:1.3.9`）+ 现有 socket.io 信令 + coturn，
替代浏览器 `RTCPeerConnection`。

## 已实现

- `KaifaWebRTC.kt`：PeerConnectionFactory、音频轨、摄像头轨、本地/远端 SurfaceViewRenderer、SDP/ICE 回调、
  静音/视频开关/切换摄像头/扬声器/挂断；ICE 连通后启动前台服务
- `CallService.kt`：通话前台服务（microphone 类型），保证切后台音频；通知渠道
- `AndroidManifest.xml`：相机/麦克风/前台服务/通知权限 + service 声明
- `config.json`：依赖 `io.getstream:stream-webrtc-android:1.3.9`，minSdk 26
- `index.uts`：init/createPeerConnection/createOffer/.../onEvent/requestCallPermissions/muteVideo
- `build:app` 会生成 `src/index.kt` 代理（需要 `@dcloudio/uni-uts-v1`）

## 接入方式（默认关闭）

1. 配置 `VITE_USE_NATIVE_CALL=1`
2. HBuilderX 打开 `app/`，制作自定义基座（UTS/Kotlin 原生插件必须自定义基座）
3. 真机首次运行授权相机/麦克风
4. 业务侧已接入：`webrtcCallService` 门面 → `nativeCallService`；`callService` 与
   `VideoCall.vue` / `AudioCall.vue` 会自动走原生分支（H5 / 默认 App 构建走浏览器版）
5. 信令复用现有 socket 事件：`call_invite` / `call_accept` / `webrtc_offer` /
   `webrtc_answer` / `webrtc_ice_candidate` / `call_end`，后端无需改动

## 事件与状态

- 插件事件：`init` / `peer-connection` / `local-description` / `remote-description` /
  `ice-candidate` / `ice-connection-state` / `remote-video` / `error` / `hangup` /
  `permissions-granted` / `permissions-denied`
- 接通（ICE CONNECTED）后：切通话音频路由 + 启动前台服务
- 视频画面由原生 SurfaceView 渲染，页面不再拿 MediaStream

## 已知限制

- **未在 HBuilderX / Android 真机编译验证**（CLI 只验证到 UTS→Kotlin 生成）
- `PeerConnection.Observer` 方法集与 stream-webrtc 1.3.9 API 可能需要按实际编译错误修正
- 视频渲染层是原生 SurfaceView，可能盖住 H5 控件；通话页覆盖层需要真机调整
- 音频路由/回声消除/锁屏保活需真机测试
- 需要后端 `CALL_CHANNEL=webrtc`（自建信令）和可用的 STUN/TURN
