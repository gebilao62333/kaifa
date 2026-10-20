// 支付 SDK 适配层（U-06 预留）
// 只负责调起微信/支付宝客户端 SDK，不伪造入账。真实商户参数与回调仍由服务端配置，
// 未配置时统一返回 supported:false，由页面提示「已预留、即将开放」。
const isWeChatBrowser = () => {
  try {
    return /MicroMessenger/i.test(navigator.userAgent || '')
  } catch (e) { return false }
}

const isAlipayClient = () => {
  try {
    return /AlipayClient/i.test(navigator.userAgent || '')
  } catch (e) { return false }
}

const hasWeixinBridge = () => typeof window !== 'undefined' && typeof window.WeixinJSBridge !== 'undefined'
const hasAlipayBridge = () => typeof window !== 'undefined' && typeof window.AlipayJSBridge !== 'undefined'

const waitForWeixinBridge = (timeout = 1500) => new Promise((resolve) => {
  if (hasWeixinBridge()) return resolve(true)
  if (typeof document === 'undefined') return resolve(false)
  const timer = setTimeout(() => resolve(false), timeout)
  document.addEventListener('WeixinJSBridgeReady', () => {
    clearTimeout(timer)
    resolve(hasWeixinBridge())
  }, { once: true })
})

const waitForAlipayBridge = (timeout = 1500) => new Promise((resolve) => {
  if (hasAlipayBridge()) return resolve(true)
  if (typeof document === 'undefined') return resolve(false)
  const timer = setTimeout(() => resolve(false), timeout)
  document.addEventListener('AlipayJSBridgeReady', () => {
    clearTimeout(timer)
    resolve(hasAlipayBridge())
  }, { once: true })
})

const paymentSdk = {
  isWeChatBrowser,
  isAlipayClient,

  // 微信 JSAPI：参数由服务端 /api/pay/wx-order（tradeType=JSAPI）返回
  async invokeWechatJsapi(params) {
    if (!params || !params.package) return { supported: false, reason: 'missing-jsapi-params' }
    const ready = await waitForWeixinBridge()
    if (!ready) return { supported: false, reason: 'not-in-wechat' }
    return new Promise((resolve) => {
      window.WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res) => {
        const ok = res && res.err_msg === 'get_brand_wcpay_request:ok'
        resolve({ supported: true, ok, raw: res })
      })
    })
  },

  // 支付宝 JSAPI：orderStr 由服务端预留接口返回（当前返回 503，待配置商户参数）
  async invokeAlipay(orderStr) {
    if (!orderStr) return { supported: false, reason: 'missing-order-str' }
    const ready = await waitForAlipayBridge()
    if (!ready) return { supported: false, reason: 'not-in-alipay' }
    return new Promise((resolve) => {
      window.AlipayJSBridge.call('tradePay', { orderStr }, (res) => {
        const ok = res && (res.resultCode === '9000' || res.resultCode === 9000)
        resolve({ supported: true, ok, raw: res })
      })
    })
  },

  getAvailability() {
    return {
      wechatJsapi: hasWeixinBridge() || isWeChatBrowser(),
      wechatNative: true,
      alipay: hasAlipayBridge() || isAlipayClient()
    }
  }
}

export default paymentSdk
