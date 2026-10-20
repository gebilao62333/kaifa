# HBuilderX 打包说明（Android）

## 前置

- HBuilderX 官网当前稳定版
- DCloud 账号（云打包需要）
- Android 签名证书（keystore，自己生成并保管）
- `app/` 已安装依赖（`pnpm install`；本机无 pnpm 时用 `npx --yes pnpm@10.15.0 install`）
- `@dcloudio/uni-uts-v1` 已安装（`build:app` 编译 UTS 插件需要）

## 线上环境（2026-10-20 已部署）

- H5 / 管理后台 / API：`https://fazwhznenrqo.sealoshzh.site`
- 打 App 基座前，在仓库根目录执行：
  ```powershell
  .\deploy\sealos\prepare-app-build.ps1
  ```
  它会写入 `app/.env.production.local`（API 域名 + 原生通话开关）；打完基座执行
  ```powershell
  .\deploy\sealos\prepare-app-build.ps1 -Restore
  ```
  删除，避免影响 H5 构建。
- 详细部署记录：`deploy/sealos/DEPLOYED-2026-10-20.md`

## 运行 / 调试

1. HBuilderX 打开 `app/` 目录
2. 运行 → 运行到浏览器（H5）或 运行到手机（App）
3. **启用原生通话**：在 `app/.env`（或打包环境）设置 `VITE_USE_NATIVE_CALL=1`，
   然后制作**自定义基座**（UTS/Kotlin 原生插件必须自定义基座，标准基座不含插件）
4. 真机首次运行会请求相机/麦克风权限；通知权限只影响前台服务通知展示，不阻断通话

## 原生插件（kaifa-webrtc）

- 位置：`src/uni_modules/kaifa-webrtc/`
- 依赖：`io.getstream:stream-webrtc-android:1.3.9`（见 `config.json`），minSdk 26
- `build:app` 会生成 `uni_modules/kaifa-webrtc/uts.../src/index.kt`（UTS→Kotlin 代理）
- 已接入：`nativeCallService` 与通话页，复用现有 socket 信令（默认关闭）
- **Kotlin 未在 HBuilderX 编译验证**：PeerConnection.Observer 方法集、stream-webrtc 1.3.9 API、
  SurfaceView 与 WebView 层级可能需要真机阶段修正

## 云打包

1. `src/manifest.json` 里确认 `appid`（当前占位 `__UNI__KAIFA01`，需换成真实 AppID）
2. `manifest.json` 的 `app-plus.distribute.android` 已列权限：相机、麦克风、前台服务、通知、网络等
3. 发行 → 原生App-云打包；选择 Android、签名证书、包名（当前未最终确定）
4. 打包含原生插件的正式包前，先用自定义基座跑通真机通话/上传/socket

## 当前限制

- 后端未部署时接口全部失败，页面只能看布局
- App 上传已实现（头像/动态图/视频/收款码/证件照），仍需真机验证临时路径与 `uni.uploadFile`
- App 语音介绍（MyServices）未接原生录音：保存时会提示，需后续接 `uni.getRecorderManager`
- P2P 取数在 App 端回退签名 URL
- 原生通话默认关闭；开启后 H5 不受影响
- iOS 未适配；`manifest.json` 目前只配了 Android 权限
- App 内 `VITE_API_ORIGIN` 必须填线上 HTTPS 域名，否则 `uni.request` 走相对路径会失败

## 打包前检查

```bash
cd app
npx --yes pnpm@10.15.0 task:auto
```

要求 `doctor/install/test/build-h5/smoke-h5/build-app/report` 全绿；`build-app` 产物在 `dist/build/app`。
