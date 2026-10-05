import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

import SplashPopup from '@/components/SplashPopup.vue'

const overlay = () => document.body.querySelector('.splash-overlay')
const card = () => document.body.querySelector('.splash-card')
const closeBtn = () => document.body.querySelector('.splash-close')
const image = () => document.body.querySelector('.splash-image')

const mountPopup = (splash) =>
  mount(SplashPopup, {
    props: { splash },
    attachTo: document.body
  })

describe('SplashPopup 开屏弹窗', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('无活动时不渲染遮罩', async () => {
    const wrapper = mountPopup(null)
    await nextTick()
    expect(overlay()).toBeNull()
    wrapper.unmount()
  })

  it('展示弹窗图片与标题', async () => {
    const wrapper = mountPopup({ id: 1, title: '周年庆', image: 'https://cdn/a.png', link: '', frequency: 1 })
    await nextTick()
    expect(overlay()).not.toBeNull()
    expect(image().getAttribute('src')).toBe('https://cdn/a.png')
    expect(document.body.querySelector('.splash-title').textContent).toBe('周年庆')
    wrapper.unmount()
  })

  it('点击关闭按钮只关闭，不跳转', async () => {
    const wrapper = mountPopup({ id: 1, title: '周年庆', image: 'https://cdn/a.png', link: '/activity', frequency: 2 })
    await nextTick()
    closeBtn().click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('navigate')).toBeUndefined()
    wrapper.unmount()
  })

  it('点击遮罩空白处关闭', async () => {
    const wrapper = mountPopup({ id: 1, title: '周年庆', image: 'https://cdn/a.png', link: '', frequency: 1 })
    await nextTick()
    overlay().click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('带链接的弹窗点击图片区域抛出 navigate', async () => {
    const wrapper = mountPopup({ id: 2, title: '限时活动', image: 'https://cdn/b.png', link: '/activity', frequency: 1 })
    await nextTick()
    card().click()
    expect(wrapper.emitted('navigate')).toEqual([['/activity']])
    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })

  it('无链接时点击卡片直接关闭', async () => {
    const wrapper = mountPopup({ id: 3, title: '公告', image: 'https://cdn/c.png', link: '', frequency: 4 })
    await nextTick()
    card().click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('图片地址失效时回退本地占位图', async () => {
    const wrapper = mountPopup({ id: 4, title: '断链活动', image: 'https://cdn/broken.png', link: '', frequency: 1 })
    await nextTick()
    image().dispatchEvent(new Event('error'))
    await nextTick()
    expect(image().getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    wrapper.unmount()
  })

  it('切换活动后重置占位图状态', async () => {
    const wrapper = mountPopup({ id: 5, title: 'A', image: 'https://cdn/a.png', link: '', frequency: 1 })
    await nextTick()
    image().dispatchEvent(new Event('error'))
    await nextTick()
    await wrapper.setProps({ splash: { id: 6, title: 'B', image: 'https://cdn/b.png', link: '', frequency: 1 } })
    await nextTick()
    expect(image().getAttribute('src')).toBe('https://cdn/b.png')
    wrapper.unmount()
  })
})
