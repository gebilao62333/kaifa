import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { auth, upload } = vi.hoisted(() => ({
  auth: { getRealNameStatus: vi.fn(), submitRealName: vi.fn() },
  upload: { uploadFile: vi.fn() }
}))

vi.mock('@/services/authService', () => ({ default: auth }))
vi.mock('@/services/uploadService', () => ({ uploadFile: upload.uploadFile }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

import RealName from '@/views/RealName.vue'

const mountPage = async () => {
  const wrapper = mount(RealName)
  await flushPromises()
  return wrapper
}

describe('RealName 审核状态渲染', () => {
  beforeEach(() => {
    auth.getRealNameStatus.mockReset()
    auth.submitRealName.mockReset().mockResolvedValue({ data: { status: 1 } })
    upload.uploadFile.mockReset()
  })

  it('status=1 显示审核中，不再误报「认证成功」', async () => {
    auth.getRealNameStatus.mockResolvedValue({
      data: { status: 1, realName: '**三', idCard: '110***********1234', time: 1700000000 }
    })
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('认证审核中')
    expect(wrapper.text()).toContain('审核中')
    expect(wrapper.text()).not.toContain('您已完成实名认证')
    expect(wrapper.find('.submit-btn').exists()).toBe(false)
  })

  it('status=2 回显服务端脱敏姓名/证件号与提交时间，不使用模板字面量', async () => {
    auth.getRealNameStatus.mockResolvedValue({
      data: { status: 2, realName: '*小明', idCard: '110***********1234', time: 1716134400 }
    })
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('认证成功')
    const values = wrapper.findAll('.info-value').map(n => n.text())
    expect(values[0]).toBe('*小明')
    expect(values[1]).toBe('110***********1234')
    expect(values[2]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(wrapper.text()).not.toContain('张**')
  })

  it('status=3 显示未通过并可重新提交', async () => {
    auth.getRealNameStatus.mockResolvedValue({ data: { status: 3, realName: '', idCard: '', time: 0 } })
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('认证未通过')
    expect(wrapper.text()).toContain('未通过')

    await wrapper.get('.resubmit-btn').trigger('click')
    expect(wrapper.find('.submit-btn').exists()).toBe(true)
  })

  it('未提交过（status=0）直接展示表单', async () => {
    auth.getRealNameStatus.mockResolvedValue({ data: { status: 0 } })
    const wrapper = await mountPage()

    expect(wrapper.find('.submit-btn').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('认证成功')
  })
})
