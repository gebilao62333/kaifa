import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import qrcode from 'qrcode-generator'

describe('PaymentGateway 微信二维码本地生成', () => {
  it('支付页不再依赖第三方二维码服务', () => {
    const src = readFileSync(resolve(__dirname, '../../src/pages/PaymentGateway.vue'), 'utf8')
    expect(src).not.toContain('api.qrserver.com')
    expect(src).toContain("qrcode-generator")
    expect(src).toContain('createDataURL')
  })

  it('qrcode-generator 可为微信 codeUrl 生成 data URL', () => {
    const qr = qrcode(0, 'M')
    qr.addData('weixin://wxpay/bizpayurl?pr=test-code-url')
    qr.make()
    const dataUrl = qr.createDataURL(4, 2)
    expect(dataUrl.startsWith('data:image/')).toBe(true)
    expect(dataUrl.length).toBeGreaterThan(200)
  })
})
