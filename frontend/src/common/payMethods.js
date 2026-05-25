export const payMethods = {
  coin: {
    id: 'coin',
    name: '金币支付',
    icon: '💰',
    desc: '使用金币支付',
    bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
  },
  alipay: {
    id: 'alipay',
    name: '支付宝',
    icon: 'Z',
    desc: '安全快捷',
    bg: 'linear-gradient(135deg, #1677ff, #4096ff)'
  },
  wechat: {
    id: 'wechat',
    name: '微信支付',
    icon: 'W',
    desc: '推荐使用',
    bg: 'linear-gradient(135deg, #07c160, #39d97e)'
  },
  card: {
    id: 'card',
    name: '银行卡支付',
    icon: 'B',
    desc: '便捷安全',
    bg: 'linear-gradient(135deg, #fa8c16, #ffc53d)'
  },
  balance: {
    id: 'balance',
    name: '余额支付',
    icon: 'Y',
    desc: '余额支付',
    bg: 'linear-gradient(135deg, #667eea, #764ba2)'
  }
}

export const getRechargeMethods = () => [
  payMethods.alipay,
  payMethods.wechat,
  payMethods.card,
  payMethods.balance
]

export const getWithdrawMethods = (bankDesc = '支持各大银行') => [
  payMethods.alipay,
  { ...payMethods.wechat, name: '微信零钱', desc: '实时到账' },
  { ...payMethods.card, desc: bankDesc }
]

export const getOrderPayMethods = () => [
  payMethods.coin
]