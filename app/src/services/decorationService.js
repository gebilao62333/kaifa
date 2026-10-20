import userPrefService from './userPrefService'
import storage from '../common/storage'

// U-20：装扮/标识跨设备生效。
// 选择页已把 selectedBadge / selectedAvatarFrame 写入 xn_user_pref，但其他页面仍只读
// localStorage；新设备登录后需要先把服务端选择回填到本地缓存，徽章/头像框才会显示。
export const hydrateDecorations = async () => {
  try {
    const res = await userPrefService.get()
    const prefs = (res && res.data && res.data.data) || {}
    if (prefs.selectedBadge && typeof prefs.selectedBadge === 'object') {
      storage.setItem('selectedBadge', JSON.stringify(prefs.selectedBadge))
    }
    if (prefs.selectedAvatarFrame && typeof prefs.selectedAvatarFrame === 'object') {
      storage.setItem('selectedAvatarFrame', JSON.stringify(prefs.selectedAvatarFrame))
    }
    return prefs
  } catch (error) {
    console.error('加载装扮失败:', error)
    return {}
  }
}

export default { hydrateDecorations }
