# kaifa-webrtc（Android UTS 插件）

目标：App 端用 Google WebRTC（Maven: `io.getstream:stream-webrtc-android:1.3.9`）+ 现有 socket.io 信令 + coturn，替代浏览器 `RTCPeerConnection`。

## 已实现

- `KaifaWebRTC.kt`：PeerConnectionFactory、音频轨、摄像头轨、本地/远端 SurfaceViewRenderer、SDP/ICE 回调、静音/切换摄像头/扬声器/挂断
- `CallService.kt`：通话前台服务（microphone 类型），保证切后台音频；通知渠道/权限
- `AndroidManifest.xml`：相机/麦克风/前台服务/通知权限 + service 声明
- `config.json`：依赖 `io.getstream:stream-webrtc-android:1.3.9`，minSdk 26
- `index.uts`：暴露 init/createPeerConnection/createOffer/... 与 `onEvent`，并请求运行时权限

## 接入方式（默认关闭）

1. 配置 `VITE_USE_NATIVE_CALL=1`
2. HBuilderX 打开 `app/`，制作自定义基座（UTS/Kotlin 原生插件必须自定义基座）
3. 真机权限：相机、麦克风、通知
4. 通过 `src/services/nativeCallAdapter.js` 调用；**尚未接入 `callService` 和通话页**，需要真机阶段完成

## 已知限制

- 未在 HBuilderX/Android 真机编译验证
- 视频渲染层是原生 SurfaceView，可能盖在 H5 控件上方；通话页覆盖层需要真机调整
- 音频路由/回声消除/锁屏保活需真机测试
- 需要后端 `CALL_CHANNEL=webrtc`（自建信令）和可用的 STUN/TURN
