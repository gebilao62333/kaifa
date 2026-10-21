import { request } from '../common/common'

// P1-8：换绑手机号。旧号由后端从当前账号解密后取，前端只负责提交新号 + 两个验证码；
// 一次 send-code 请求会同时给「当前号」和「新号」各发一个验证码（后端两个独立短信场景）。
const MOBILE_PATTERN = /^1[3-9]\d{9}$/

const assertNewMobile = (newPhone) => {
  const phone = String(newPhone === null || newPhone === undefined ? '' : newPhone).trim()
  if (!MOBILE_PATTERN.test(phone)) {
    throw new Error('请输入正确的新手机号')
  }
  return phone
}

const mobileChangeService = {
  // oldPhone 可选：仅用于服务端做「你提交的旧号与账号绑定号一致」的额外校验
  async sendCode({ oldPhone = '', newPhone } = {}) {
    const phone = assertNewMobile(newPhone)
    const payload = { newPhone: phone }
    if (oldPhone) payload.oldPhone = String(oldPhone).trim()
    return request('/api/user/change-mobile/send-code', 'POST', payload)
  },

  // 返回 { data: { requireRelogin: true, devicesRevoked } }：后端已吊销全部会话，调用方需清本地态回登录页
  async changeMobile({ newPhone, oldCode, newCode } = {}) {
    const phone = assertNewMobile(newPhone)
    if (!oldCode || !newCode) {
      throw new Error('请输入原手机号和新手机号的验证码')
    }
    return request('/api/user/change-mobile', 'POST', {
      newPhone: phone,
      oldCode: String(oldCode).trim(),
      newCode: String(newCode).trim()
    })
  }
}

export default mobileChangeService
