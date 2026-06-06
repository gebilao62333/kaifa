import { request } from '../common/common'

const shareService = {
  async getInviteCode(userId) {
    return request('/api/share/invite-code?userId=' + userId, 'GET')
  },

  async generateQRCode(text, width = 200) {
    return request('/api/share/qrcode', 'POST', { text, width })
  }
}

export default shareService
