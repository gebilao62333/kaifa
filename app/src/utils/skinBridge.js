// 《未完成事项清单》C-3：装扮商城与其它页面之间的本地桥接。
//
// 背景：商城（SkinShop）的「使用中」读服务端 /api/user/skins，而聊天页 / 我的 / 用户主页
// 仍读 localStorage 的 selectedAvatarFrame / selectedBadge（历史实现）。
// 两条状态源不互通，导致「在商城买了/切换了装扮，别的页面不生效」。
//
// 这里把商城选中的装扮转成历史页面认识的 localStorage 负载：
//   frame  → { id, name, style }（AvatarFrame.vue / ChatRoom / Mine / UserProfile 读取）
//   badge  → { id, label, icon, style }（IdentityBadge.vue / Mine 读取）
// 只做展示层桥接，所有权与扣款仍以服务端为准（H-6）。
// 残留：跨设备仍是各设备本地态；彻底方案是让各页面直接消费服务端 skinShop.using。

export const LEGACY_FRAME_KEY = 'selectedAvatarFrame'
export const LEGACY_BADGE_KEY = 'selectedBadge'

export const buildLegacySkinSelection = (item) => {
  if (!item || !item.id) return null
  if (item.type === 'frame') {
    return {
      key: LEGACY_FRAME_KEY,
      payload: { id: item.id, name: item.name || '', style: item.style || {} }
    }
  }
  if (item.type === 'badge') {
    return {
      key: LEGACY_BADGE_KEY,
      payload: {
        id: item.id,
        label: item.label || item.name || '',
        icon: item.icon || '',
        style: item.style || {}
      }
    }
  }
  // 聊天气泡/主题皮肤暂未被其它页面消费，不做桥接
  return null
}

export const applyLegacySkinSelection = (item, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) => {
  const selection = buildLegacySkinSelection(item)
  if (!selection || !storage) return false
  try {
    storage.setItem(selection.key, JSON.stringify(selection.payload))
    return true
  } catch (e) {
    return false
  }
}
