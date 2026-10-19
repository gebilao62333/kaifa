# HBuilderX 打包说明（Android）

## 前置

- HBuilderX 官网当前稳定版
- DCloud 账号（云打包需要）
- Android 签名证书（keystore，自己生成并保管）
- `app/` 已 `pnpm install`，HBuilderX 能识别 uni-app CLI 项目

## 运行 / 调试

1. HBuilderX 打开 `app/` 目录
2. 运行 → 运行到浏览器（H5）或 运行到手机（App）
3. 真机调试需制作自定义基座（如果有原生插件）

## 云打包

1. `src/manifest.json` 里确认 `appid`（当前占位 `__UNI__KAIFA01`，需换成真实 AppID）
2. 发行 → 原生App-云打包
3. 选择 Android、签名证书、包名（当前未最终确定）
4. 首次打包前确认权限：相机、麦克风、前台服务、通知（`manifest.json` 已列）

## 当前限制

- 通话页仍是 H5 浏览器 WebRTC；App 端原生 WebRTC 插件只有骨架（`src/uni_modules/kaifa-webrtc`），未实现
- 没有后端时接口全部失败，页面只能看布局
- iOS 未适配；`manifest.json` 目前只配了 Android 权限
- App 内 `VITE_API_ORIGIN` 必须填线上 HTTPS 域名，否则 `uni.request` 走相对路径会失败

## 打包前检查

```bash
cd app
pnpm task:auto
```

要求 `build-h5`、`smoke-h5`、`build-app` 全绿；`build-app` 产物在 `dist/build/app`。
