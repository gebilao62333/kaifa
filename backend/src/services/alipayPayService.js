// 支付宝支付 SDK 预留服务（U-06）
// 当前只预留商户配置检查与下单接口；未配置时不生成订单、不伪造回调。
const isConfigured = () => !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY && process.env.ALIPAY_PUBLIC_KEY)

const createOrder = async (userId, packageId) => {
  if (!isConfigured()) {
    const error = new Error('支付宝 SDK 已预留，待配置商户参数后开放');
    error.code = 'ALIPAY_NOT_CONFIGURED';
    throw error;
  }
  const error = new Error('支付宝下单接口已预留，暂未接入真实网关');
  error.code = 'ALIPAY_NOT_IMPLEMENTED';
  throw error;
}

module.exports = { isConfigured, createOrder }
