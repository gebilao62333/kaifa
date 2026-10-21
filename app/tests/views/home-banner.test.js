import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HomeBanner from '@/components/HomeBanner.vue'

describe('HomeBanner 图片失败兜底', () => {
  it('图片加载失败时展示标题占位，不留空白轮播', async () => {
    const wrapper = mount(HomeBanner, {
      props: {
        banners: [
          { id: 1, title: '新用户注册送好礼', image: '/uploads/missing.png', link: '/promo' },
          { id: 2, title: 'VIP会员限时特惠', image: '/uploads/missing2.png', link: '/vip' }
        ]
      }
    })

    const images = wrapper.findAll('.banner-image')
    expect(images).toHaveLength(2)
    await images[0].trigger('error')

    expect(wrapper.find('.banner-fallback').exists()).toBe(true)
    expect(wrapper.find('.banner-fallback-title').text()).toBe('新用户注册送好礼')
  })
})
